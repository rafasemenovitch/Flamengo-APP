import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, ErrorState, ListGroup, ListItem, MediaImage, Screen, SectionHeader, SegmentedControl, Skeleton, Text, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import type { FacilityType, GateQueue, Stadium } from '@/types/stadium';
import { formatNumber } from '@/utils/format';
import { haptic } from '@/utils/haptics';
import { ArrivalMap, TRANSPORT_ICON } from './ArrivalMap';
import { openDirections, travelModeFor } from './directions';
import { FACILITY_ICON, FACILITY_LABEL, StadiumMap } from './StadiumMap';

type Tab = 'estadio' | 'chegar' | 'filas';
type Selection = { kind: 'sector' | 'gate' | 'facility'; id: string } | undefined;

const LAYERS: FacilityType[] = ['restroom', 'food', 'store', 'accessibility', 'first-aid', 'atm'];

/**
 * MODO MARACANÃ — aberto a qualquer torcedor, sem depender de ingresso
 * (inspirado no mapa do estádio dos apps da NFL). Ingresso, portão do
 * ingresso e cadastro facial ficam na aba Ingressos.
 */
export function StadiumModeScreen({ route }: RootScreenProps<'StadiumMode'>) {
  const { spacing, layout } = useTheme();
  const [tab, setTab] = useState<Tab>(route.params?.tab ?? 'estadio');
  const stadium = useAsync(() => services.stadium.getStadium());
  const queues = useAsync(() => services.stadium.getQueues());

  // Filas "ao vivo": atualiza a cada minuto.
  const refreshQueues = queues.refresh;
  useEffect(() => {
    const t = setInterval(refreshQueues, 60_000);
    return () => clearInterval(t);
  }, [refreshQueues]);

  if (stadium.loading) return <Screen title="Modo Maracanã"><View style={{ padding: layout.gutter, gap: spacing.lg }}><Skeleton height={120} /><Skeleton height={340} /></View></Screen>;
  if (stadium.error || !stadium.data) return <Screen title="Modo Maracanã" scroll={false}><ErrorState onRetry={stadium.reload} /></Screen>;
  const s = stadium.data;

  return (
    <Screen title="Modo Maracanã" refreshing={queues.refreshing} onRefresh={queues.refresh}>
      <View style={{ paddingHorizontal: layout.gutter, gap: 2, marginBottom: spacing.lg }}>
        <Text variant="display">{s.name}</Text>
        <Text variant="caption" tone="secondary">{s.nickname} · {formatNumber(s.capacity)} lugares · {s.address}</Text>
      </View>
      <SegmentedControl<Tab>
        segments={[{ key: 'estadio', label: 'Estádio' }, { key: 'chegar', label: 'Como chegar' }, { key: 'filas', label: 'Filas agora' }]}
        value={tab}
        onChange={setTab}
      />
      <View style={{ marginTop: spacing.lg }}>
        {tab === 'estadio' && <StadiumTab stadium={s} queues={queues.data} initialSectorId={route.params?.sectorId} />}
        {tab === 'chegar' && <ArrivalTab stadium={s} />}
        {tab === 'filas' && <QueuesTab stadium={s} queues={queues.data} loading={queues.loading} />}
      </View>
    </Screen>
  );
}

function StadiumTab({ stadium: s, queues, initialSectorId }: { stadium: Stadium; queues?: GateQueue[]; initialSectorId?: string }) {
  const { colors, spacing, layout, radius } = useTheme();
  const [layers, setLayers] = useState<FacilityType[]>(['restroom', 'food']);
  const [sel, setSel] = useState<Selection>(initialSectorId ? { kind: 'sector', id: initialSectorId } : undefined);

  const select = (next: Selection) => {
    haptic.select();
    setSel((cur) => (cur?.kind === next?.kind && cur?.id === next?.id ? undefined : next));
  };
  const toggleLayer = (t: FacilityType) => {
    haptic.select();
    setLayers((l) => (l.includes(t) ? l.filter((x) => x !== t) : [...l, t]));
  };

  const sector = sel?.kind === 'sector' ? s.sectors.find((x) => x.id === sel.id) : undefined;
  const gate = sel?.kind === 'gate' ? s.gates.find((x) => x.id === sel.id) : undefined;
  const facility = sel?.kind === 'facility' ? s.facilities.find((x) => x.id === sel.id) : undefined;
  const queueOf = (gateId: string) => queues?.find((q) => q.gateId === gateId);
  const highlightGate = gate?.id ?? (sector ? s.gates.find((g) => g.sectorIds.includes(sector.id))?.id : undefined);

  return (
    <View style={{ gap: spacing.lg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: spacing.sm }}>
        {LAYERS.map((t) => {
          const on = layers.includes(t);
          return (
            <Pressable
              key={t}
              onPress={() => toggleLayer(t)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySubtle : colors.surface }}
            >
              <Ionicons name={FACILITY_ICON[t]} size={14} color={on ? colors.primaryText : colors.textSecondary} />
              <Text variant="label" tone={on ? 'brand' : 'secondary'}>{FACILITY_LABEL[t]}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.md }}>
        <Card padding="sm">
          <StadiumMap
            stadium={s}
            height={340}
            highlightSectorId={sector?.id}
            highlightGateId={highlightGate}
            facilityTypes={layers}
            selectedFacilityId={facility?.id}
            onSectorPress={(id) => select({ kind: 'sector', id })}
            onGatePress={(id) => select({ kind: 'gate', id })}
            onFacilityPress={(id) => select({ kind: 'facility', id })}
          />
          <Text variant="footnote" tone="tertiary" align="center">Toque em setores, portões e serviços · esquema ilustrativo</Text>
        </Card>

        {!sel && (
          <Card variant="outline">
            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
              <Ionicons name="hand-left-outline" size={22} color={colors.textTertiary} />
              <Text variant="callout" tone="secondary" style={{ flex: 1 }}>Toque num setor para ver portões, fila e serviços próximos, ou ligue as camadas acima.</Text>
            </View>
          </Card>
        )}

        {sector && (
          <Card variant="elevated" padding="lg">
            <View style={{ gap: spacing.md }}>
              <View style={styles.between}>
                <Text variant="h2">{sector.name}</Text>
                <Badge label={sector.ring === 'upper' ? 'Anel superior' : 'Anel inferior'} tone="neutral" />
              </View>
              <Text variant="body" tone="secondary">{sector.description}</Text>
              <MediaImage imageKey={sector.viewImageKey} icon="eye-outline" style={{ height: 150, borderRadius: radius.md, justifyContent: 'flex-end' }} scrim>
                <View style={{ padding: spacing.md }}>
                  <Text variant="label" tone="onMedia">Vista do setor</Text>
                  <Text variant="footnote" tone="onMedia" style={{ opacity: 0.8 }}>Fotos de cada setor em breve</Text>
                </View>
              </MediaImage>
              {s.gates.filter((g) => g.sectorIds.includes(sector.id)).map((g) => {
                const q = queueOf(g.id);
                return (
                  <View key={g.id} style={[styles.between, { gap: spacing.md }]}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{g.label}{g.accessible ? ' · acessível' : ''}</Text>
                      <Text variant="caption" tone="secondary">{g.access}</Text>
                    </View>
                    {q && <Badge label={`fila ~${q.waitMinutes} min`} tone={q.level === 'low' ? 'success' : q.level === 'medium' ? 'warning' : 'danger'} />}
                  </View>
                );
              })}
              <Text variant="label" tone="tertiary">Perto deste setor</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {s.facilities.filter((f) => f.nearSectorIds.includes(sector.id)).map((f) => (
                  <Badge key={f.id} label={f.label} icon={FACILITY_ICON[f.type]} tone="neutral" />
                ))}
              </View>
              {(() => {
                const g = s.gates.find((x) => x.sectorIds.includes(sector.id));
                return g ? <Button label={`Rota até o ${g.label}`} icon="navigate" variant="secondary" onPress={() => openDirections({ coords: g.coords, label: g.label }, 'walking')} fullWidth /> : null;
              })()}
            </View>
          </Card>
        )}

        {gate && (
          <Card variant="elevated" padding="lg">
            <View style={{ gap: spacing.md }}>
              <View style={styles.between}>
                <Text variant="h2">{gate.label}</Text>
                {queueOf(gate.id) && <Badge label={`fila ~${queueOf(gate.id)!.waitMinutes} min`} tone="warning" />}
              </View>
              <Text variant="body" tone="secondary">{gate.access}</Text>
              <Text variant="callout">Setores: {gate.sectorIds.map((id) => s.sectors.find((x) => x.id === id)?.name).join(', ')}</Text>
              {gate.accessible && <Badge label="Acesso para pessoas com deficiência" icon="accessibility" tone="info" />}
              <Button label="Traçar rota até este portão" icon="navigate" onPress={() => openDirections({ coords: gate.coords, label: gate.label }, 'walking')} fullWidth />
            </View>
          </Card>
        )}

        {facility && (
          <Card variant="elevated" padding="lg">
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Ionicons name={FACILITY_ICON[facility.type]} size={22} color={colors.primaryText} />
                <Text variant="h2" style={{ flex: 1 }}>{facility.label}</Text>
              </View>
              <Text variant="body" tone="secondary">{facility.description}</Text>
              <Text variant="caption" tone="tertiary">Perto de: {facility.nearSectorIds.map((id) => s.sectors.find((x) => x.id === id)?.name).join(', ')}</Text>
            </View>
          </Card>
        )}
      </View>
    </View>
  );
}

function ArrivalTab({ stadium: s }: { stadium: Stadium }) {
  const { colors, spacing, layout } = useTheme();
  return (
    <View style={{ gap: spacing.xxl }}>
      <View style={{ paddingHorizontal: layout.gutter }}>
        <ArrivalMap stadium={s} />
      </View>
      <View>
        <SectionHeader title="Pontos de acesso" subtitle="Toque para traçar a rota real" />
        <ListGroup>
          {s.transport.map((t) => (
            <ListItem
              key={t.id}
              icon={TRANSPORT_ICON[t.mode]}
              title={t.title}
              subtitle={`${t.details} · Portão ${t.bestGateIds.join('/')} · ${t.walkMinutes} min a pé`}
              trailing={<Ionicons name="navigate-outline" size={18} color={colors.primaryText} />}
              chevron={false}
              onPress={() => openDirections({ query: t.mapsQuery, label: t.title }, travelModeFor(t.mode))}
            />
          ))}
        </ListGroup>
      </View>
      <View style={{ paddingHorizontal: layout.gutter }}>
        <Card>
          <Text variant="h3" style={{ marginBottom: spacing.sm }}>Antes de sair de casa</Text>
          {s.tips.map((tip) => (
            <View key={tip} style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: 4 }}>
              <Ionicons name="information-circle" size={16} color={colors.info} style={{ marginTop: 2 }} />
              <Text variant="callout" tone="secondary" style={{ flex: 1 }}>{tip}</Text>
            </View>
          ))}
        </Card>
      </View>
    </View>
  );
}

function QueuesTab({ stadium: s, queues, loading }: { stadium: Stadium; queues?: GateQueue[]; loading: boolean }) {
  const { spacing, layout } = useTheme();
  if (loading || !queues) return <View style={{ paddingHorizontal: layout.gutter }}><Skeleton height={300} /></View>;
  const best = [...queues].filter((q) => s.gates.find((g) => g.id === q.gateId)?.id !== 'B').sort((a, b) => a.waitMinutes - b.waitMinutes)[0];
  return (
    <View style={{ gap: spacing.lg }}>
      {best && (
        <View style={{ paddingHorizontal: layout.gutter }}>
          <Card variant="tinted">
            <Text variant="overline" tone="brand">Menor fila agora</Text>
            <Text variant="h2">Portão {best.gateId} · ~{best.waitMinutes} min</Text>
            <Text variant="caption" tone="secondary">Lembre que cada setor entra pelo seu portão.</Text>
          </Card>
        </View>
      )}
      <View>
        <SectionHeader title="Todos os portões" subtitle="Atualiza a cada minuto" accessory={<Badge label="Simulado" tone="demo" />} />
        <ListGroup>
          {queues.map((q) => {
            const g = s.gates.find((x) => x.id === q.gateId);
            return (
              <ListItem
                key={q.gateId}
                icon="people-outline"
                title={g?.label ?? `Portão ${q.gateId}`}
                subtitle={g?.sectorIds.map((id) => s.sectors.find((x) => x.id === id)?.name).join(', ')}
                trailing={<Badge label={`~${q.waitMinutes} min`} tone={q.level === 'low' ? 'success' : q.level === 'medium' ? 'warning' : 'danger'} />}
              />
            );
          })}
        </ListGroup>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
