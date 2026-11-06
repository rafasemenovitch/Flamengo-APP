import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Card, IconButton, palette, PressableScale, Text, useTheme, withAlpha } from '@/design-system';
import { DEMO_SCENARIOS, IS_DEMO, type DemoScenario } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { MatchDayPlan } from '@/types/stadium';
import type { MatchDetail } from '@/types/match';
import { formatNumber, shiftTime } from '@/utils/format';
import { haptic } from '@/utils/haptics';

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export function HomeHeader({ unread, onSecretLongPress }: { unread: number; onSecretLongPress?: () => void }) {
  const navigation = useNavigation();
  const { profile, progress } = useAppState();
  const { spacing, layout, colors, radius } = useTheme();
  return (
    <View style={[styles.between, { paddingHorizontal: layout.gutter, paddingTop: spacing.md, paddingBottom: spacing.lg }]}>
      <View style={{ flex: 1, gap: 6 }}>
        {/* Toque longo na saudação = controles da demonstração (sem pista visual). */}
        <Pressable
          onLongPress={() => {
            haptic.medium();
            onSecretLongPress?.();
          }}
          delayLongPress={600}
          accessible={false}
        >
          <Text variant="caption" tone="secondary">
            {greeting()},
          </Text>
          <Text variant="h1" numberOfLines={1}>
            {profile?.firstName ?? 'Torcedor'}
          </Text>
        </Pressable>
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

const SCENARIO_HINT: Record<DemoScenario, string> = {
  upcoming: 'Próximo jogo daqui a 2 dias, com contagem regressiva e venda aberta',
  matchday: 'Jogo hoje: banner e atalho do Modo Maracanã aparecem',
  live: 'Ao vivo a partir dos 67\'. O relógio anda e o 3º gol sai aos 83\'',
  finished: 'Fim de jogo: resultado, melhores momentos e craque do jogo',
};

/**
 * Painel ESCONDIDO de controle da demonstração (modo apresentação). Abre com
 * toque longo na saudação da Home; só existe no modo demo. Na reunião, o app
 * parece 100% real e o apresentador troca o estado do jogo discretamente.
 */
export function DemoControlsSheet({ visible, value, onChange, onClose }: { visible: boolean; value: DemoScenario; onChange: (s: DemoScenario) => void; onClose: () => void }) {
  const { colors, spacing, radius, layout } = useTheme();
  if (!IS_DEMO) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }} onPress={onClose} accessible={false}>
        <Pressable onPress={() => undefined} accessible={false}>
          <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.surfaceElevated, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: layout.gutter, gap: spacing.md }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong }} />
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Ionicons name="easel-outline" size={20} color={colors.demo} />
              <Text variant="h3" style={{ flex: 1 }}>Controles da demonstração</Text>
            </View>
            <Text variant="caption" tone="secondary">Escolha o momento do jogo em destaque. Visível só para quem apresenta.</Text>
            {DEMO_SCENARIOS.map((s) => {
              const active = s.key === value;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => {
                    haptic.select();
                    onChange(s.key);
                    onClose();
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [styles.row, { gap: spacing.md, minHeight: 56, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySubtle : colors.surface, opacity: pressed ? 0.75 : 1 }]}
                >
                  <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? colors.primaryText : colors.textTertiary} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{s.label}</Text>
                    <Text variant="caption" tone="secondary">{SCENARIO_HINT[s.key]}</Text>
                  </View>
                </Pressable>
              );
            })}
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type Shortcut = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; highlight?: boolean; badge?: number };

export function QuickActions({ matchday }: { matchday: boolean }) {
  const navigation = useNavigation();
  const { cartCount } = useAppState();
  const { colors, spacing, layout, radius } = useTheme();
  const items: Shortcut[] = [
    // Modo Maracanã é aberto a todos; em dia de jogo ganha destaque.
    { key: 'maraca', label: 'Modo Maracanã', icon: 'location', onPress: () => navigation.navigate('StadiumMode'), highlight: matchday },
    { key: 'ingressos', label: 'Ingressos', icon: 'ticket', onPress: () => navigation.navigate('Tabs', { screen: 'Ingressos' }) },
    { key: 'loja', label: 'Loja', icon: 'bag-handle', onPress: () => navigation.navigate('Store'), badge: cartCount },
    { key: 'socio', label: 'Sócio-Torcedor', icon: 'card', onPress: () => navigation.navigate('Membership') },
    { key: 'flatv', label: 'FlaTV', icon: 'play-circle', onPress: () => navigation.navigate('FlaTV') },
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
      <Card variant="tinted" onPress={() => navigation.navigate('TicketWallet')} accessibilityLabel={`Seu jogo é hoje. Portão ${plan.recommendedGateId}, chegue às ${arrival}`}>
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
