import { useState } from 'react';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Countdown,
  Crest,
  DemoBadge,
  EmptyState,
  Filters,
  ListGroup,
  ListItem,
  LiveIndicator,
  Mascot,
  Screen,
  SectionTitle,
  Skeleton,
  TabHeader,
  Tabs,
  Text,
  TreatedImage,
  typography,
  useAlerts,
  useTheme,
  type TypographyVariant,
} from '@/design-system';
import { CLUB, TEAMS } from '@/data/demo/seed';

const SCALE: TypographyVariant[] = [
  'displayHero',
  'displayXl',
  'displayL',
  'displayM',
  'displayS',
  'titleL',
  'titleM',
  'titleS',
  'bodyL',
  'bodyM',
  'bodyS',
  'labelButton',
  'labelM',
  'labelTab',
  'overline',
  'numericTable',
];

const COLOR_KEYS = [
  'bgCanvas',
  'bgRaised',
  'bgRaised2',
  'bgRed',
  'inkPrimary',
  'inkSecondary',
  'inkTertiary',
  'lineHairline',
  'accent',
  'accentPressed',
  'accentText',
  'live',
  'success',
  'warning',
] as const;

/** Catálogo do design system (especificação 15.1). Só em desenvolvimento. */
export function DesignSystemScreen() {
  const { colors, layout, radius } = useTheme();
  const { showAlert, showToast } = useAlerts();
  const [tab, setTab] = useState<'a' | 'b' | 'c'>('a');
  const [filter, setFilter] = useState<'x' | 'y' | 'z'>('x');
  const [countdownTarget] = useState(() => new Date(Date.now() + 3 * 3600_000 + 25 * 60_000).toISOString());
  const pad = { paddingHorizontal: layout.gutter };
  const sample = (v: TypographyVariant) =>
    v.startsWith('display') || v === 'numericTable' ? '2 – 1 · 19h45' : 'Dia de Mengão';

  return (
    <Screen title="Design system">
      <TabHeader title="Catálogo" subtitle="Tokens e componentes da identidade" />

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Cores" />
        <View style={[pad, { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }]}>
          {COLOR_KEYS.map((k) => (
            <View key={k} style={{ width: 96, gap: 4 }}>
              <View
                style={{
                  height: 48,
                  borderRadius: radius.s,
                  backgroundColor: colors[k],
                  borderWidth: 1,
                  borderColor: colors.lineHairline,
                }}
              />
              <Text variant="bodyS" tone="secondary">
                {k}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Tipografia" />
        <View style={[pad, { gap: 16 }]}>
          {SCALE.map((v) => (
            <View key={v}>
              <Text variant="bodyS" tone="tertiary">
                {v} · {typography[v].fontSize}/{typography[v].lineHeight}
              </Text>
              <Text variant={v} numberOfLines={1} adjustsFontSizeToFit>
                {sample(v)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 48, gap: 16 }}>
        <SectionTitle title="Botões" />
        <View style={[pad, { gap: 12 }]}>
          <Button label="Comprar ingresso" icon="ticket-outline" onPress={() => undefined} fullWidth />
          <Button label="Detalhes" variant="secondary" onPress={() => undefined} fullWidth />
          <Button label="Fantasma" variant="ghost" onPress={() => undefined} fullWidth />
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Button label="Pequeno" size="sm" onPress={() => undefined} />
            <Button label="Desabilitado" size="sm" disabled onPress={() => undefined} />
            <Button label="Ver todas" variant="link" onPress={() => undefined} />
          </View>
        </View>
      </View>

      <View style={{ marginTop: 48, gap: 12 }}>
        <SectionTitle title="Abas e filtros" />
        <Tabs
          segments={[
            { key: 'a', label: 'Próximos' },
            { key: 'b', label: 'Resultados' },
            { key: 'c', label: 'Tabela' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <Filters
          segments={[
            { key: 'x', label: 'Todas' },
            { key: 'y', label: 'Brasileirão' },
            { key: 'z', label: 'Libertadores' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </View>

      <View style={{ marginTop: 48, gap: 16 }}>
        <SectionTitle title="Escudos, selos, ao vivo" />
        <View style={[pad, { flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
          {[20, 28, 40, 56].map((s) => (
            <Crest key={s} team={CLUB} size={s} />
          ))}
          <Crest team={TEAMS.pal!} size={40} />
        </View>
        <View style={[pad, { flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
          <DemoBadge />
          <Badge label="Encerrado" />
          <LiveIndicator minute="67'" />
          <Text variant="labelM" tone="brand">
            +10 pts
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 48, gap: 16 }}>
        <SectionTitle title="Contagem regressiva" />
        <Countdown target={countdownTarget} />
      </View>

      <View style={{ marginTop: 48, gap: 16 }}>
        <SectionTitle title="Imagem tratada" />
        <TreatedImage imageKey="catalogo" aspect="wide" overlay style={{ height: 200 }}>
          <View style={{ position: 'absolute', left: 20, bottom: 20 }}>
            <Text variant="titleL" tone="onMedia">
              Fotografia “bandeirão”
            </Text>
          </View>
        </TreatedImage>
      </View>

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Lista" />
        <ListGroup>
          <ListItem
            title="Passaporte Rubro-Negro"
            subtitle="Seus jogos no estádio"
            large
            onPress={() => undefined}
          />
          <ListItem title="Rankings" subtitle="Brasil, estado, amigos" large onPress={() => undefined} />
        </ListGroup>
      </View>

      <View style={{ marginTop: 48, gap: 16 }}>
        <SectionTitle title="Mascote, skeleton, estados" />
        <View style={[pad, { flexDirection: 'row', gap: 16 }]}>
          <Mascot pose="assistant-wave" size={96} />
          <Mascot pose="fan-goal" size={96} />
        </View>
        <View style={[pad, { gap: 8 }]}>
          <Skeleton height={120} radius={radius.l} />
          <Skeleton width="60%" height={14} />
        </View>
        <EmptyState compact title="Nada por aqui ainda." message="Quando tiver novidade, aparece aqui." />
      </View>

      <View style={{ marginTop: 48, gap: 12, paddingHorizontal: layout.gutter }}>
        <SectionTitle title="Avisos" />
        <Button
          label="Simular gol"
          onPress={() =>
            showAlert({
              id: `goal-demo-${Date.now()}`,
              variant: 'goal',
              title: 'GOL DO MENGÃO!',
              message: "Vasconcelos (54')",
              primary: { label: 'Ver lance' },
            })
          }
          fullWidth
        />
        <Button
          label="Toast"
          variant="secondary"
          onPress={() => showToast('Adicionado ao carrinho.')}
          fullWidth
        />
      </View>
    </Screen>
  );
}
