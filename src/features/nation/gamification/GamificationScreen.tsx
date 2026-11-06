import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import {
  Button,
  ErrorState,
  ProgressBar,
  Screen,
  SectionTitle,
  Skeleton,
  Text,
  useTheme,
} from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import type { Medal } from '@/types/gamification';
import { formatFullDate } from '@/utils/format';

const GROUP_LABEL: Record<Medal['group'], string> = {
  presenca: 'Presença',
  palpites: 'Palpites',
  conhecimento: 'Conhecimento',
  comunidade: 'Comunidade',
  especiais: 'Especiais',
};
const TIER_LABEL = { gold: 'Ouro', silver: 'Prata', bronze: 'Bronze' } as const;

/** Medalha: colorida se conquistada, apagada com cadeado se não (base: MedalBadge do Zuno). */
function MedalItem({ medal, onPress, size = 72 }: { medal: Medal; onPress?: () => void; size?: number }) {
  const { colors } = useTheme();
  const unlocked = !!medal.unlockedAt;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`Medalha ${medal.name}, ${unlocked ? 'conquistada' : 'bloqueada'}`}
      style={({ pressed }) => ({
        width: '30%',
        flexGrow: 1,
        alignItems: 'center',
        gap: 8,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: unlocked ? colors[medal.tier] : colors.lineHairline,
          backgroundColor: colors.bgRaised,
        }}
      >
        <Ionicons
          name={(unlocked ? medal.icon : 'lock-closed-outline') as keyof typeof Ionicons.glyphMap}
          size={size * 0.4}
          color={unlocked ? colors[medal.tier] : colors.inkTertiary}
        />
      </View>
      <Text variant="labelM" align="center" numberOfLines={2} tone={unlocked ? 'primary' : 'tertiary'}>
        {medal.name}
      </Text>
    </Pressable>
  );
}

/** Conquistas: só as medalhas (bolões, quiz e enquetes ficam na Nação). */
export function GamificationScreen() {
  const { colors, layout, radius } = useTheme();
  const medals = useAsync(() => services.gamification.getMedals());
  const [open, setOpen] = useState<Medal>();
  const unlocked = medals.data?.filter((m) => m.unlockedAt).length ?? 0;
  const groups = Object.keys(GROUP_LABEL) as Medal['group'][];

  return (
    <Screen title="Conquistas">
      <View style={{ paddingHorizontal: layout.gutter, gap: 4 }}>
        <Text variant="displayXl">
          {unlocked}
          <Text variant="displayS" tone="secondary">
            {' '}
            / {medals.data?.length ?? '—'}
          </Text>
        </Text>
        <Text variant="bodyS" tone="secondary">
          medalhas conquistadas
        </Text>
      </View>

      {medals.loading ? (
        <View style={{ padding: layout.gutter }}>
          <Skeleton height={300} radius={8} />
        </View>
      ) : medals.error ? (
        <ErrorState compact onRetry={medals.reload} />
      ) : (
        groups.map((g) => {
          const list = medals.data?.filter((m) => m.group === g) ?? [];
          if (!list.length) return null;
          return (
            <View key={g} style={{ marginTop: 48 }}>
              <SectionTitle title={GROUP_LABEL[g]} />
              <View
                style={{
                  paddingHorizontal: layout.gutter,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  rowGap: 24,
                  columnGap: 8,
                }}
              >
                {list.map((m) => (
                  <MedalItem key={m.id} medal={m} onPress={() => setOpen(m)} />
                ))}
              </View>
            </View>
          );
        })
      )}

      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(undefined)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: colors.scrim,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onPress={() => setOpen(undefined)}
        >
          {open && (
            <View
              style={{
                width: '100%',
                maxWidth: 360,
                backgroundColor: colors.bgRaised,
                borderRadius: radius.l,
                padding: 24,
                alignItems: 'center',
                gap: 16,
              }}
            >
              <MedalItem medal={open} size={96} />
              <Text variant="bodyS" tone="secondary">
                {GROUP_LABEL[open.group]} · {TIER_LABEL[open.tier]}
              </Text>
              <Text variant="bodyM" tone="secondary" align="center">
                {open.description}
              </Text>
              {open.unlockedAt ? (
                <Text variant="labelM" tone="success">
                  Conquistada em {formatFullDate(open.unlockedAt)}
                </Text>
              ) : (
                <View style={{ alignSelf: 'stretch', gap: 6 }}>
                  <ProgressBar value={open.progress ?? 0} height={4} />
                  <Text variant="bodyS" tone="secondary" align="center">
                    {Math.round((open.progress ?? 0) * 100)}% concluído
                  </Text>
                </View>
              )}
              <Button label="Fechar" variant="secondary" size="sm" onPress={() => setOpen(undefined)} />
            </View>
          )}
        </Pressable>
      </Modal>
    </Screen>
  );
}
