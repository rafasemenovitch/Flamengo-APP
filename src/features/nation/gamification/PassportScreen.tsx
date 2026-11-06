import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import {
  Card,
  ClubCrest,
  EmptyState,
  ErrorState,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { formatFullDate } from '@/utils/format';

/** Passaporte Rubro-Negro: um "carimbo" por jogo em que o torcedor esteve no estádio. */
export function PassportScreen() {
  const { colors, spacing, layout } = useTheme();
  const { profile, progress } = useAppState();
  const q = useAsync(() => services.gamification.getPassport());

  return (
    <Screen title="Passaporte Rubro-Negro" refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.lg }}>
        <View style={{ gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <ClubCrest size={48} />
            <View style={{ flex: 1 }}>
              <Text variant="overline" tone="onMedia" style={{ opacity: 0.8 }}>
                Passaporte
              </Text>
              <Text variant="h2" tone="onMedia">
                {profile?.name ?? 'Torcedor'}
              </Text>
              <Text variant="caption" tone="onMedia" style={{ opacity: 0.8 }}>
                Rubro-negro desde {profile?.fanSince ?? '—'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {[
              [String(q.data?.length ?? '—'), 'Jogos'],
              [String(q.data?.filter((s) => s.result === 'Vitória').length ?? '—'), 'Vitórias'],
              [String(progress?.attendanceStreak ?? '—'), 'Sequência'],
            ].map(([v, l]) => (
              <View key={l} style={{ flex: 1, alignItems: 'center' }}>
                <Text variant="displayXl">{v}</Text>
                <Text variant="footnote" tone="onMedia" style={{ opacity: 0.8 }}>
                  {l}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Carimbos" subtitle="Presença registrada pelo ingresso (simulado)" />
        <View
          style={{
            paddingHorizontal: layout.gutter,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.md,
          }}
        >
          {q.loading ? (
            <Skeleton height={300} radius={20} />
          ) : q.error ? (
            <ErrorState compact onRetry={q.reload} />
          ) : q.data?.length === 0 ? (
            <EmptyState
              compact
              icon="book-outline"
              title="Nenhum carimbo ainda"
              message="Vá a um jogo com ingresso do app para ganhar o primeiro."
            />
          ) : (
            q.data?.map((s, i) => (
              <Card key={s.id} style={{ flexBasis: '47%', flexGrow: 1 }} padding="md">
                <View
                  style={{
                    alignItems: 'center',
                    gap: spacing.sm,
                    transform: [{ rotate: `${(i % 2 ? 1 : -1) * 2}deg` }],
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: s.result === 'Vitória' ? colors.primary : colors.borderStrong,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={s.result === 'Vitória' ? 'trophy' : 'football'}
                      size={26}
                      color={s.result === 'Vitória' ? colors.primaryText : colors.textTertiary}
                    />
                  </View>
                  <Text variant="label" align="center">
                    {s.label}
                  </Text>
                  <Text variant="footnote" tone="tertiary" align="center">
                    {s.venue} · {formatFullDate(s.date)}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}
