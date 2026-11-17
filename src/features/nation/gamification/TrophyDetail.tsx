import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, ProgressBar, Text, useTheme } from '@/design-system';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type { TrophyAchievement } from '@/types/trophies';
import { formatFullDate } from '@/utils/format';
import { awardLabel, goalAwards, goalRequirement } from '@/utils/trophies';
import { TrophyArt } from './TrophyArt';

export function TrophyDetail({
  achievement,
  onClose,
}: {
  achievement: TrophyAchievement;
  onClose: () => void;
}) {
  const { colors, layout, spacing, radius } = useTheme();
  const { height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const awards = goalAwards(achievement);
  const current = achievement.current ?? awards[0]!;
  return (
    <Modal visible transparent animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessible={false}
        style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          accessible={false}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={{
            width: '100%',
            maxWidth: layout.maxContentWidth,
            alignSelf: 'center',
            backgroundColor: colors.bgCanvas,
            borderTopLeftRadius: radius.l,
            borderTopRightRadius: radius.l,
            overflow: 'hidden',
          }}
        >
          <SafeAreaView edges={['bottom']}>
            <View
              style={{
                paddingHorizontal: layout.gutter,
                paddingTop: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text variant="overline" tone="secondary">
                {achievement.kind === 'special' ? 'Conquista única' : 'Evolução do prêmio'}
              </Text>
              <IconButton
                icon="close"
                variant="plain"
                accessibilityLabel="Fechar detalhes do prêmio"
                onPress={onClose}
              />
            </View>
            <ScrollView
              style={{ maxHeight: height * 0.78, flexGrow: 0 }}
              contentContainerStyle={{
                paddingHorizontal: layout.gutter,
                paddingBottom: spacing.xl,
                gap: spacing.xl,
              }}
            >
              <View style={{ alignItems: 'center', gap: spacing.md }}>
                <TrophyArt award={current} locked={!achievement.earned} size={112} />
                <Text variant="titleL" align="center" accessibilityRole="header">
                  {achievement.name}
                </Text>
                <Text variant="bodyM" align="center" tone="secondary">
                  {achievement.description}
                </Text>
                <Text variant="labelM" tone={achievement.earned ? 'brand' : 'secondary'}>
                  {achievement.earned ? awardLabel(current) : 'Ainda não conquistado'}
                </Text>
                {!!achievement.earnedAt && (
                  <Text variant="bodyS" tone="secondary">
                    Conquistado em {formatFullDate(achievement.earnedAt)}
                  </Text>
                )}
              </View>
              {achievement.next && (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="titleS">{achievement.earned ? 'Próxima evolução' : 'Para conquistar'}</Text>
                  <Text variant="bodyM" tone="secondary">
                    {goalRequirement(achievement, achievement.next.target)}
                  </Text>
                  <ProgressBar value={achievement.progress} height={6} />
                  <Text variant="bodyS" tone="secondary">
                    {achievement.kind === 'evolving'
                      ? `${achievement.value.toLocaleString('pt-BR')} de ${achievement.next.target.toLocaleString('pt-BR')} · ${Math.round(achievement.progress * 100)}%`
                      : `${Math.round(achievement.progress * 100)}% concluído`}
                  </Text>
                </View>
              )}
              {achievement.kind === 'evolving' && (
                <View>
                  <Text variant="titleM" style={{ marginBottom: spacing.md }}>
                    Um objetivo, seis evoluções
                  </Text>
                  {awards.map((award) => {
                    const reached = achievement.value >= award.target;
                    const isCurrent = achievement.current?.target === award.target;
                    return (
                      <View
                        key={`${award.kind}-${award.tier}`}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.md,
                          paddingVertical: spacing.md,
                          borderBottomWidth: 1,
                          borderColor: colors.lineHairline,
                        }}
                      >
                        <TrophyArt award={award} locked={!reached} size={40} />
                        <View style={{ flex: 1, gap: spacing.xs }}>
                          <Text variant="titleS">{awardLabel(award)}</Text>
                          <Text variant="bodyS" tone="secondary">
                            {goalRequirement(achievement, award.target)}
                          </Text>
                          {isCurrent && (
                            <Text variant="labelM" tone="brand">
                              Seu prêmio atual
                            </Text>
                          )}
                        </View>
                        <Ionicons
                          name={reached ? 'checkmark' : 'lock-closed-outline'}
                          size={18}
                          color={reached ? colors.accentText : colors.inkSecondary}
                          accessibilityLabel={reached ? 'Conquistado' : 'Ainda não conquistado'}
                        />
                      </View>
                    );
                  })}
                  <Text variant="bodyS" tone="secondary" style={{ paddingTop: spacing.lg }}>
                    O prêmio evolui no mesmo lugar da sala. Sua contagem continua depois do troféu de ouro.
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
