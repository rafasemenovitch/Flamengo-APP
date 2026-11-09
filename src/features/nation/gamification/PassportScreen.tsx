import { View } from 'react-native';

import { EmptyState, ErrorState, Screen, SectionTitle, Skeleton, Text, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { formatShortDate } from '@/utils/format';

/** Passaporte Rubro-Negro: o pé quente é o protagonista; carimbos em grade. */
export function PassportScreen() {
  const { colors, layout, radius } = useTheme();
  const { progress } = useAppState();
  const q = useAsync(() => services.gamification.getPassport());
  const stamps = q.data ?? [];
  const wins = stamps.filter((s) => s.result === 'Vitória').length;

  return (
    <Screen title="Passaporte" refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ paddingHorizontal: layout.gutter, gap: 24 }}>
        <View>
          <Text variant="overline" tone="secondary">
            Pé quente
          </Text>
          <Text variant="displayXl">
            {progress?.luckyStreak ?? '—'}{' '}
            <Text variant="displayM" tone="secondary">
              vitórias seguidas
            </Text>
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          {[
            [String(stamps.length), 'jogos'],
            [String(wins), 'vitórias'],
            [String(progress?.bestLuckyStreak ?? '—'), 'melhor sequência'],
          ].map(([v, l]) => (
            <View key={l} style={{ flex: 1 }}>
              <Text variant="displayM">{v}</Text>
              <Text variant="bodyS" tone="secondary">
                {l}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Carimbos" />
        {q.loading ? (
          <View style={{ paddingHorizontal: layout.gutter }}>
            <Skeleton height={300} radius={16} />
          </View>
        ) : q.error ? (
          <ErrorState compact onRetry={q.reload} />
        ) : stamps.length === 0 ? (
          <EmptyState compact pose="fan-passport" title="Nenhum carimbo ainda." />
        ) : (
          <View style={{ paddingHorizontal: layout.gutter, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {stamps.map((s) => {
              const win = s.result === 'Vitória';
              return (
                <View
                  key={s.id}
                  style={{
                    width: '48%',
                    flexGrow: 1,
                    aspectRatio: 1,
                    backgroundColor: colors.bgRaised,
                    borderRadius: radius.l,
                    padding: 16,
                    justifyContent: 'space-between',
                  }}
                >
                  <Text variant="displayXl" style={{ color: win ? colors.accentText : colors.inkTertiary }}>
                    {win ? 'V' : s.result === 'Empate' ? 'E' : 'D'}
                  </Text>
                  <View style={{ gap: 2 }}>
                    <Text variant="titleS" numberOfLines={2}>
                      {s.label}
                    </Text>
                    <Text variant="bodyS" tone="secondary">
                      {formatShortDate(s.date)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Screen>
  );
}
