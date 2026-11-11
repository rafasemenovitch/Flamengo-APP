import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, ErrorState, Screen, Skeleton, Tabs, Text, TreatedImage, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import type { FacilityType, GateQueue, Stadium } from '@/types/stadium';
import { haptic } from '@/utils/haptics';
import { ArrivalMap, TRANSPORT_ICON } from './ArrivalMap';
import { openDirections, travelModeFor } from './directions';
import { FACILITY_LABEL, StadiumMap } from './StadiumMap';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'estadio' | 'chegar' | 'filas';
type Selection = { kind: 'sector' | 'gate' | 'facility'; id: string } | undefined;

const LAYERS: FacilityType[] = ['restroom', 'food', 'store', 'accessibility', 'first-aid'];

/**
 * MODO MARACANÃ: aberto a qualquer torcedor, sem dados de ingresso.
 * Pouco texto: o mapa e os números falam.
 */
export function StadiumModeScreen({ route }: RootScreenProps<'StadiumMode'>) {
  const { layout } = useTheme();
  const [tab, setTab] = useState<Tab>(route.params?.tab ?? 'estadio');
  const stadium = useAsync(() => services.stadium.getStadium());
  const queues = useAsync(() => services.stadium.getQueues());

  const refreshQueues = queues.refresh;
  useEffect(() => {
    const t = setInterval(refreshQueues, 60_000);
    return () => clearInterval(t);
  }, [refreshQueues]);

  if (stadium.loading)
    return (
      <Screen title="Modo Maracanã">
        <View style={{ padding: layout.gutter }}>
          <Skeleton height={360} radius={16} />
        </View>
      </Screen>
    );
  if (stadium.error || !stadium.data)
    return (
      <Screen title="Modo Maracanã" scroll={false}>
        <ErrorState onRetry={stadium.reload} />
      </Screen>
    );
  const s = stadium.data;

  return (
    <Screen title="Modo Maracanã" refreshing={queues.refreshing} onRefresh={queues.refresh}>
      <Tabs<Tab>
        segments={[
          { key: 'estadio', label: 'Estádio' },
          { key: 'chegar', label: 'Como chegar' },
          { key: 'filas', label: 'Filas' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <View style={{ marginTop: 20 }}>
        {tab === 'estadio' && (
          <StadiumTab stadium={s} queues={queues.data} initialSectorId={route.params?.sectorId} />
        )}
        {tab === 'chegar' && <ArrivalTab stadium={s} />}
        {tab === 'filas' && <QueuesTab stadium={s} queues={queues.data} />}
      </View>
    </Screen>
  );
}

function StadiumTab({
  stadium: s,
  queues,
  initialSectorId,
}: {
  stadium: Stadium;
  queues?: GateQueue[];
  initialSectorId?: string;
}) {
  const { colors, layout, radius } = useTheme();
  const [layers, setLayers] = useState<FacilityType[]>(['restroom', 'food']);
  const [sel, setSel] = useState<Selection>(
    initialSectorId ? { kind: 'sector', id: initialSectorId } : undefined
  );

  const select = (next: Selection) => {
    haptic.select();
    setSel((cur) => (cur?.kind === next?.kind && cur?.id === next?.id ? undefined : next));
  };
  const toggleLayer = (t: FacilityType) => {
    haptic.select();
    setLayers((l) => (l.includes(t) ? l.filter((x) => x !== t) : [...l, t]));
  };

  const sector = sel?.kind === 'sector' ? s.sectors.find((x) => x.id === sel.id) : undefined;
  const gate =
    sel?.kind === 'gate'
      ? s.gates.find((x) => x.id === sel.id)
      : sector
        ? s.gates.find((g) => g.sectorIds.includes(sector.id))
        : undefined;
  const facility = sel?.kind === 'facility' ? s.facilities.find((x) => x.id === sel.id) : undefined;
  const wait = (gateId?: string) => queues?.find((q) => q.gateId === gateId)?.waitMinutes;

  return (
    <View style={{ gap: 20 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 8 }}
      >
        {LAYERS.map((t) => {
          const on = layers.includes(t);
          return (
            <Pressable
              key={t}
              onPress={() => toggleLayer(t)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={{
                height: 32,
                paddingHorizontal: 12,
                borderRadius: radius.s,
                justifyContent: 'center',
                borderWidth: on ? 0 : 1,
                borderColor: colors.lineHairline,
                backgroundColor: on ? colors.inkPrimary : 'transparent',
              }}
            >
              <Text variant="labelM" style={{ color: on ? colors.bgCanvas : colors.inkSecondary }}>
                {FACILITY_LABEL[t]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <StadiumMap
        stadium={s}
        height={360}
        highlightSectorId={sector?.id}
        highlightGateId={gate?.id}
        facilityTypes={layers}
        selectedFacilityId={facility?.id}
        onSectorPress={(id) => select({ kind: 'sector', id })}
        onGatePress={(id) => select({ kind: 'gate', id })}
        onFacilityPress={(id) => select({ kind: 'facility', id })}
      />

      <View style={{ paddingHorizontal: layout.gutter, gap: 16, minHeight: 120 }}>
        {!sel && (
          <Text variant="bodyM" tone="secondary" align="center">
            Toque num setor ou portão
          </Text>
        )}

        {(sector || (sel?.kind === 'gate' && gate)) && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View>
                <Text variant="overline" tone="secondary">
                  {sector ? 'Setor' : 'Portão'}
                </Text>
                <Text variant="displayL">{sector ? sector.name : gate?.label}</Text>
              </View>
              {gate && wait(gate.id) !== undefined && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text variant="displayM">{wait(gate.id)} min</Text>
                  <Text variant="bodyS" tone="secondary">
                    fila no Portão {gate.id}
                  </Text>
                </View>
              )}
            </View>
            {sector && (
              <TreatedImage
                imageKey={sector.viewImageKey}
                aspect="wide"
                style={{ height: 140, borderRadius: radius.s }}
              >
                <View style={{ position: 'absolute', left: 12, bottom: 10 }}>
                  <Text variant="labelM" tone="onMedia">
                    Vista do setor · em breve
                  </Text>
                </View>
              </TreatedImage>
            )}
            {gate && (
              <Button
                label={`Rota até o Portão ${gate.id}`}
                icon="navigate-outline"
                onPress={() => openDirections({ coords: gate.coords, label: gate.label }, 'walking')}
                fullWidth
              />
            )}
          </>
        )}

        {facility && (
          <View style={{ gap: 4 }}>
            <Text variant="overline" tone="secondary">
              {FACILITY_LABEL[facility.type]}
            </Text>
            <Text variant="displayM">{facility.label}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ArrivalTab({ stadium: s }: { stadium: Stadium }) {
  const { colors, layout } = useTheme();
  return (
    <View style={{ gap: 32 }}>
      <View style={{ paddingHorizontal: layout.gutter }}>
        <ArrivalMap stadium={s} />
      </View>
      <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
        {s.transport.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => openDirections({ query: t.mapsQuery, label: t.title }, travelModeFor(t.mode))}
            accessibilityRole="button"
            accessibilityLabel={`Rota: ${t.title}`}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              minHeight: 64,
              paddingHorizontal: layout.gutter,
              borderBottomWidth: 1,
              borderColor: colors.lineHairline,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name={TRANSPORT_ICON[t.mode]} size={22} color={colors.inkPrimary} />
            <View style={{ flex: 1 }}>
              <Text variant="titleS">{t.title.replace(' — ', ' · ')}</Text>
              <Text variant="bodyS" tone="secondary">
                Portão {t.bestGateIds.join(' ou ')} · {t.walkMinutes} min a pé
              </Text>
            </View>
            <Ionicons name="navigate-outline" size={18} color={colors.accentText} />
          </Pressable>
        ))}
      </View>
      <Text variant="bodyS" tone="tertiary" align="center">
        O estádio não tem estacionamento próprio
      </Text>
    </View>
  );
}

/** Filas: o protagonista é o portão com menor espera; o resto em linhas com barra fina. */
function QueuesTab({ stadium: s, queues }: { stadium: Stadium; queues?: GateQueue[] }) {
  const { colors, layout } = useTheme();
  if (!queues)
    return (
      <View style={{ paddingHorizontal: layout.gutter }}>
        <Skeleton height={300} radius={8} />
      </View>
    );
  const sorted = [...queues].filter((q) => q.gateId !== 'B').sort((a, b) => a.waitMinutes - b.waitMinutes);
  const best = sorted[0];
  const max = Math.max(...queues.map((q) => q.waitMinutes), 1);
  const sectorsOf = (gateId: string) =>
    s.gates
      .find((g) => g.id === gateId)
      ?.sectorIds.map((id) => s.sectors.find((x) => x.id === id)?.name)
      .join(', ');

  return (
    <View style={{ gap: 32 }}>
      {best && (
        <View style={{ paddingHorizontal: layout.gutter }}>
          <Text variant="overline" tone="secondary">
            Menor fila agora
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
            <Text variant="displayXl">Portão {best.gateId}</Text>
            <Text variant="displayM" tone="brand">
              {best.waitMinutes} min
            </Text>
          </View>
        </View>
      )}
      <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
        {[...queues]
          .sort((a, b) => a.gateId.localeCompare(b.gateId))
          .map((q) => (
            <View
              key={q.gateId}
              style={{
                paddingHorizontal: layout.gutter,
                paddingVertical: 14,
                gap: 8,
                borderBottomWidth: 1,
                borderColor: colors.lineHairline,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Text variant="displayM" style={{ width: 28 }}>
                  {q.gateId}
                </Text>
                <Text variant="bodyS" tone="secondary" style={{ flex: 1 }} numberOfLines={1}>
                  {sectorsOf(q.gateId)}
                </Text>
                <Text variant="numericTable">{q.waitMinutes} min</Text>
              </View>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.bgRaised2, marginLeft: 44 }}>
                <View
                  style={{
                    width: `${(q.waitMinutes / max) * 100}%`,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: q.gateId === best?.gateId ? colors.accent : colors.inkTertiary,
                  }}
                />
              </View>
            </View>
          ))}
      </View>
      <Text variant="bodyS" tone="tertiary" align="center">
        Estimativa simulada · atualiza a cada minuto
      </Text>
    </View>
  );
}
