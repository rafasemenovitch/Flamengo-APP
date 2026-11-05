import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Card, IconButton, palette, PressableScale, Text, useTheme, withAlpha } from '@/design-system';
import { DEMO_SCENARIOS, IS_DEMO, type DemoScenario } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { MatchDayPlan } from '@/types/stadium';
import type { MatchDetail } from '@/types/match';
import { formatNumber, shiftTime } from '@/utils/format';

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export function HomeHeader({ unread }: { unread: number }) {
  const navigation = useNavigation();
  const { profile, progress } = useAppState();
  const { spacing, layout, colors, radius } = useTheme();
  return (
    <View style={[styles.between, { paddingHorizontal: layout.gutter, paddingTop: spacing.md, paddingBottom: spacing.lg }]}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text variant="caption" tone="secondary">
          {greeting()},
        </Text>
        <Text variant="h1" numberOfLines={1}>
          {profile?.firstName ?? 'Torcedor'}
        </Text>
        {progress && (
          <Pressable
            onPress={() => navigation.navigate('Gamification')}
            accessibilityRole="button"
            accessibilityLabel={`Nível ${progress.level.level}, ${progress.level.name}, ${progress.points} pontos`}
            style={[styles.row, { gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.primarySubtle }]}
          >
            <Ionicons name="shield" size={12} color={colors.primaryText} />
            <Text variant="label" tone="brand" style={{ fontSize: 12 }}>
              Nível {progress.level.level} · {progress.level.name}
            </Text>
            <Text variant="label" tone="secondary" style={{ fontSize: 12 }}>
              · {formatNumber(progress.points)} pts
            </Text>
          </Pressable>
        )}
      </View>
      <IconButton icon="notifications-outline" accessibilityLabel="Notificações" badgeCount={unread} onPress={() => navigation.navigate('Notifications')} />
    </View>
  );
}

/** Seletor de estado do jogo — SÓ em desenvolvimento + modo demo (para a apresentação). */
export function DevScenarioSwitcher({ value, onChange }: { value: DemoScenario; onChange: (s: DemoScenario) => void }) {
  const { colors, spacing, radius, layout } = useTheme();
  if (!__DEV__ || !IS_DEMO) return null;
  return (
    <View style={{ marginHorizontal: layout.gutter, marginBottom: spacing.md, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.demo, gap: spacing.sm }}>
      <Text variant="overline" tone="demo">Dev · estado do jogo</Text>
      <View style={[styles.row, { gap: spacing.xs }]}>
        {DEMO_SCENARIOS.map((s) => {
          const active = s.key === value;
          return (
            <Pressable
              key={s.key}
              onPress={() => onChange(s.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{ flex: 1, minHeight: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.demo : colors.demoSubtle }}
            >
              <Text variant="label" style={{ fontSize: 12, color: active ? colors.background : colors.demo }}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type Shortcut = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; highlight?: boolean; badge?: number };

export function QuickActions({ matchday }: { matchday: boolean }) {
  const navigation = useNavigation();
  const { cartCount } = useAppState();
  const { colors, spacing, layout, radius } = useTheme();
  const items: Shortcut[] = [
    ...(matchday ? [{ key: 'maraca', label: 'Modo Maracanã', icon: 'location' as const, onPress: () => navigation.navigate('StadiumMode'), highlight: true }] : []),
    { key: 'ingressos', label: 'Ingressos', icon: 'ticket', onPress: () => navigation.navigate('Tabs', { screen: 'Ingressos' }) },
    { key: 'loja', label: 'Loja', icon: 'bag-handle', onPress: () => navigation.navigate('Store'), badge: cartCount },
    { key: 'socio', label: 'Sócio-Torcedor', icon: 'card', onPress: () => navigation.navigate('Membership') },
    { key: 'flatv', label: 'FlaTV', icon: 'play-circle', onPress: () => navigation.navigate('VideoDetail', { videoId: 'v2' }) },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: spacing.sm }}>
      {items.map((it) => (
        <PressableScale
          key={it.key}
          onPress={it.onPress}
          accessibilityLabel={it.label}
          style={{
            width: 92,
            paddingVertical: spacing.md,
            alignItems: 'center',
            gap: spacing.sm,
            borderRadius: radius.lg,
            backgroundColor: it.highlight ? colors.primary : colors.surface,
            borderWidth: 1,
            borderColor: it.highlight ? colors.primary : colors.border,
          }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: it.highlight ? withAlpha(palette.white, 0.18) : colors.primarySubtle }}>
            <Ionicons name={it.icon} size={22} color={it.highlight ? colors.onPrimary : colors.primaryText} />
            {!!it.badge && (
              <View style={{ position: 'absolute', top: -2, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                <Text variant="footnote" tone="onPrimary" style={{ fontSize: 10, lineHeight: 12 }}>{it.badge}</Text>
              </View>
            )}
          </View>
          <Text variant="label" align="center" numberOfLines={2} style={{ fontSize: 12, color: it.highlight ? colors.onPrimary : colors.textPrimary }}>
            {it.label}
          </Text>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

/** Banner de dia de jogo: portão recomendado e horário ideal de chegada. */
export function MatchdayBanner({ match, plan }: { match: MatchDetail; plan?: MatchDayPlan }) {
  const navigation = useNavigation();
  const { colors, spacing, layout } = useTheme();
  if (!plan) return null;
  const arrival = shiftTime(match.kickoff, Number(plan.recommendedArrival));
  const queue = plan.queues.find((q) => q.gateId === plan.recommendedGateId);
  return (
    <View style={{ paddingHorizontal: layout.gutter }}>
      <Card variant="tinted" onPress={() => navigation.navigate('StadiumMode', { matchId: match.id })} accessibilityLabel={`Seu jogo é hoje. Portão ${plan.recommendedGateId}, chegue às ${arrival}`}>
        <View style={[styles.row, { gap: spacing.md }]}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="location" size={24} color={colors.onPrimary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Text variant="title">Seu jogo é hoje!</Text>
              <Badge label="Demo" tone="demo" />
            </View>
            <Text variant="caption" tone="secondary">
              Portão {plan.recommendedGateId} · chegue às {arrival}
              {queue ? ` · fila ~${queue.waitMinutes} min` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primaryText} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
});
