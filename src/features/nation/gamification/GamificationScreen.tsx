import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Badge, Button, Card, ErrorState, ProgressBar, Screen, SectionHeader, Skeleton, Text, useTheme } from '@/design-system';
import { PollCard, QuizCard } from '@/features/shared/Engagement';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { Medal } from '@/types/gamification';
import { formatFullDate, formatNumber } from '@/utils/format';

const GROUP_LABEL: Record<Medal['group'], string> = {
  presenca: 'Presença',
  palpites: 'Palpites',
  conhecimento: 'Conhecimento',
  comunidade: 'Comunidade',
  especiais: 'Especiais',
};

/** Medalha (inspirada no MedalBadge do Zuno): colorida se conquistada, apagada com cadeado se não. */
function MedalItem({ medal, onPress }: { medal: Medal; onPress: () => void }) {
  const { colors } = useTheme();
  const unlocked = !!medal.unlockedAt;
  const tierColor = colors[medal.tier];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Medalha ${medal.name}, ${unlocked ? 'conquistada' : 'bloqueada'}`}
      style={({ pressed }) => ({ width: '30%', flexGrow: 1, alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: unlocked ? tierColor : colors.surfaceMuted, borderWidth: 3, borderColor: unlocked ? colors.surface : colors.border }}>
        <Ionicons name={medal.icon as keyof typeof Ionicons.glyphMap} size={30} color={unlocked ? colors.onPrimary : colors.textTertiary} />
        {!unlocked && (
          <View style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="lock-closed" size={11} color={colors.textTertiary} />
          </View>
        )}
      </View>
      <Text variant="footnote" align="center" numberOfLines={2} tone={unlocked ? 'primary' : 'tertiary'}>{medal.name}</Text>
    </Pressable>
  );
}

export function GamificationScreen() {
  const navigation = useNavigation();
  const { colors, spacing, layout, radius } = useTheme();
  const { progress } = useAppState();
  const medals = useAsync(() => services.gamification.getMedals());
  const pools = useAsync(() => services.gamification.getPools());
  const [open, setOpen] = useState<Medal>();

  const unlockedCount = medals.data?.filter((m) => m.unlockedAt).length ?? 0;

  return (
    <Screen title="Pontos e conquistas">
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.lg }}>
        {progress ? (
          <Card variant="elevated" padding="lg">
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View>
                  <Text variant="overline" tone="brand">Nível {progress.level.level}</Text>
                  <Text variant="h1">{progress.level.name}</Text>
                </View>
                <Text variant="number">{formatNumber(progress.points)} pts</Text>
              </View>
              {progress.nextLevel && (
                <>
                  <ProgressBar value={(progress.points - progress.level.minPoints) / (progress.nextLevel.minPoints - progress.level.minPoints)} />
                  <Text variant="caption" tone="secondary">Faltam {formatNumber(progress.nextLevel.minPoints - progress.points)} pts para {progress.nextLevel.name}</Text>
                </>
              )}
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Badge label={`+${progress.weeklyPoints} nesta semana`} tone="success" icon="trending-up" />
                <Badge label={`${progress.attendanceStreak} jogos seguidos`} tone="warning" icon="flame" />
              </View>
            </View>
          </Card>
        ) : (
          <Skeleton height={170} radius={20} />
        )}
        <Card variant="outline" padding="sm">
          <Text variant="caption" tone="secondary">
            Pontos ganhos com presença no estádio, palpites, quizzes e enquetes. São virtuais: não valem dinheiro e não há apostas.
          </Text>
        </Card>
        <Button label="Ver rankings" icon="podium" variant="secondary" onPress={() => navigation.navigate('Rankings')} fullWidth />
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Medalhas" subtitle={medals.data ? `${unlockedCount} de ${medals.data.length} conquistadas` : undefined} />
        <View style={{ paddingHorizontal: layout.gutter }}>
          {medals.loading ? (
            <Skeleton height={260} radius={20} />
          ) : medals.error ? (
            <ErrorState compact onRetry={medals.reload} />
          ) : (
            <Card>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.lg, columnGap: spacing.sm }}>
                {medals.data?.map((m) => <MedalItem key={m.id} medal={m} onPress={() => setOpen(m)} />)}
              </View>
            </Card>
          )}
        </View>
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Bolões" subtitle="Com amigos, família e trabalho" />
        <View style={{ paddingHorizontal: layout.gutter, gap: spacing.sm }}>
          {pools.data?.map((p) => (
            <Card key={p.id} padding="sm">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySubtle, alignItems: 'center', justifyContent: 'center' }}>
                  <Text variant="label" tone="brand">{p.userPosition}º</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{p.name}</Text>
                  <Text variant="caption" tone="secondary">{p.members} participantes · {p.userPoints} pts</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: layout.gutter, marginTop: spacing.xxl, gap: spacing.lg }}>
        <QuizCard />
        <PollCard />
      </View>

      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(undefined)}>
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }} onPress={() => setOpen(undefined)}>
          {open && (
            <View style={{ width: '100%', maxWidth: 360, backgroundColor: colors.surfaceElevated, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.md }}>
              <MedalItem medal={open} onPress={() => undefined} />
              <Badge label={`${GROUP_LABEL[open.group]} · ${open.tier === 'gold' ? 'Ouro' : open.tier === 'silver' ? 'Prata' : 'Bronze'}`} tone="neutral" />
              <Text variant="body" tone="secondary" align="center">{open.description}</Text>
              {open.unlockedAt ? (
                <Text variant="caption" tone="success">Conquistada em {formatFullDate(open.unlockedAt)}</Text>
              ) : (
                <View style={{ alignSelf: 'stretch', gap: 6 }}>
                  <ProgressBar value={open.progress ?? 0} />
                  <Text variant="caption" tone="secondary" align="center">{Math.round((open.progress ?? 0) * 100)}% concluído</Text>
                </View>
              )}
              <Button label="Fechar" variant="secondary" onPress={() => setOpen(undefined)} />
            </View>
          )}
        </Pressable>
      </Modal>
    </Screen>
  );
}
