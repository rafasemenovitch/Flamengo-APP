import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Card, PressableScale, ProgressBar, Screen, SectionHeader, Skeleton, Text, useTheme } from '@/design-system';
import { PollCard, QuizCard } from '@/features/shared/Engagement';
import { useAsync } from '@/hooks/useAsync';
import type { RootStackParamList } from '@/navigation/types';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { formatNumber } from '@/utils/format';

type Tile = { route: keyof RootStackParamList; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap };

const TILES: Tile[] = [
  { route: 'Passport', title: 'Passaporte', subtitle: 'Seus jogos no estádio', icon: 'book' },
  { route: 'Rankings', title: 'Rankings', subtitle: 'Geral, semanal, amigos', icon: 'podium' },
  { route: 'Community', title: 'Comunidade', subtitle: 'Grupos por região', icon: 'chatbubbles' },
  { route: 'Gamification', title: 'Conquistas', subtitle: 'Medalhas e bolões', icon: 'trophy' },
];

export function NationScreen() {
  const navigation = useNavigation();
  const { colors, spacing, layout, radius } = useTheme();
  const { progress } = useAppState();
  const membership = useAsync(() => services.membership.getMembership());
  const plans = useAsync(() => services.membership.getPlans());
  const plan = plans.data?.find((p) => p.id === membership.data?.planId);
  const toNext = progress?.nextLevel ? (progress.points - progress.level.minPoints) / (progress.nextLevel.minPoints - progress.level.minPoints) : 1;

  return (
    <Screen reserveFab>
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: spacing.xl, gap: spacing.xs }}>
        <Text variant="display" accessibilityRole="header">Nação</Text>
        <Text variant="caption" tone="secondary">A maior torcida do Brasil, num lugar só</Text>
      </View>

      <View style={{ paddingHorizontal: layout.gutter, marginTop: spacing.xl, gap: spacing.md }}>
        {!progress ? (
          <Skeleton height={150} radius={radius.xl} />
        ) : (
          <PressableScale onPress={() => navigation.navigate('Gamification')} accessibilityLabel={`Seu nível: ${progress.level.name}, ${progress.points} pontos`}>
            <LinearGradient colors={colors.heroGradient} style={{ borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md }}>
              <View style={styles.between}>
                <View>
                  <Text variant="overline" tone="onMedia" style={{ opacity: 0.8 }}>Nível {progress.level.level}</Text>
                  <Text variant="h1" tone="onMedia">{progress.level.name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text variant="number" tone="onMedia">{formatNumber(progress.points)}</Text>
                  <Text variant="footnote" tone="onMedia" style={{ opacity: 0.8 }}>pontos</Text>
                </View>
              </View>
              <ProgressBar value={toNext} color={colors.onPrimary} track="rgba(255,255,255,0.2)" />
              <View style={styles.between}>
                <Text variant="caption" tone="onMedia" style={{ opacity: 0.85 }}>
                  {progress.nextLevel ? `${formatNumber(progress.nextLevel.minPoints - progress.points)} pts para ${progress.nextLevel.name}` : 'Nível máximo'}
                </Text>
                <View style={[styles.row, { gap: 4 }]}>
                  <Ionicons name="flame" size={14} color={colors.warning} />
                  <Text variant="caption" tone="onMedia">{progress.attendanceStreak} jogos seguidos</Text>
                </View>
              </View>
            </LinearGradient>
          </PressableScale>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {TILES.map((t) => (
            <Card key={t.route} onPress={() => navigation.navigate(t.route as never)} accessibilityLabel={t.title} style={{ flexBasis: '47%', flexGrow: 1 }}>
              <View style={{ gap: spacing.sm }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySubtle, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={t.icon} size={20} color={colors.primaryText} />
                </View>
                <Text variant="title">{t.title}</Text>
                <Text variant="footnote" tone="secondary">{t.subtitle}</Text>
              </View>
            </Card>
          ))}
        </View>
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Sócio-Torcedor" onAction={() => navigation.navigate('Membership')} actionLabel="Ver" />
        <View style={{ paddingHorizontal: layout.gutter }}>
          <Card onPress={() => navigation.navigate('Membership')} accessibilityLabel="Sócio-Torcedor">
            <View style={[styles.row, { gap: spacing.md }]}>
              <Ionicons name="card" size={32} color={colors.primaryText} />
              <View style={{ flex: 1 }}>
                <Text variant="title">{plan ? plan.name : 'Seja sócio'}</Text>
                <Text variant="caption" tone="secondary">
                  {plan ? `${plan.ticketDiscountPct}% sobre a inteira · prioridade ${plan.ticketPriority} · carteirinha digital` : 'Prioridade e descontos em ingressos'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </View>
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Loja" onAction={() => navigation.navigate('Store')} actionLabel="Abrir loja" />
        <View style={{ paddingHorizontal: layout.gutter }}>
          <Card onPress={() => navigation.navigate('Store')} accessibilityLabel="Abrir loja">
            <View style={[styles.row, { gap: spacing.md }]}>
              <Ionicons name="shirt" size={32} color={colors.primaryText} />
              <View style={{ flex: 1 }}>
                <Text variant="title">Novo Manto 2026</Text>
                <Text variant="caption" tone="secondary">Camisas, treino, casual e acessórios com desconto de sócio</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </View>
      </View>

      <View style={{ paddingHorizontal: layout.gutter, marginTop: spacing.xxl, gap: spacing.lg }}>
        <QuizCard />
        <PollCard />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
