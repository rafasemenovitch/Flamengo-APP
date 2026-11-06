import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';

import {
  Button,
  ErrorState,
  MediaImage,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@/design-system';
import { HList, NewsCard, VideoCard } from '@/features/shared/ContentCards';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { formatFullDate } from '@/utils/format';

function age(birth: string) {
  const b = new Date(birth);
  const n = new Date();
  return (
    n.getFullYear() - b.getFullYear() - (n < new Date(n.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0)
  );
}

export function PlayerProfileScreen({ route }: RootScreenProps<'PlayerProfile'>) {
  const navigation = useNavigation();
  const { spacing, layout, radius } = useTheme();
  const { profile, toggleFavoritePlayer } = useAppState();
  const q = useAsync(() => services.matches.getPlayer(route.params.playerId), [route.params.playerId]);
  const news = useAsync(() => services.news.getLatest(50));
  const videos = useAsync(() => services.flatv.getVideos());
  const p = q.data;

  if (q.loading)
    return (
      <Screen title="Jogador">
        <View style={{ padding: layout.gutter, gap: spacing.lg }}>
          <Skeleton height={260} radius={radius.xl} />
          <Skeleton height={160} />
        </View>
      </Screen>
    );
  if (q.error || !p)
    return (
      <Screen title="Jogador" scroll={false}>
        <ErrorState onRetry={q.reload} />
      </Screen>
    );

  const fav = profile?.favoritePlayerIds.includes(p.id) ?? false;
  const s = p.season;
  const stats: [string, number][] =
    p.position === 'Goleiro'
      ? [
          ['Jogos', s.matches],
          ['Sem sofrer gols', s.cleanSheets ?? 0],
          ['Minutos', s.minutes],
          ['Cartões', s.yellowCards + s.redCards],
        ]
      : [
          ['Jogos', s.matches],
          ['Gols', s.goals],
          ['Assistências', s.assists],
          ['Minutos', s.minutes],
        ];
  const relatedNews = (news.data ?? []).filter((n) => n.playerIds.includes(p.id));
  const relatedVideos = (videos.data ?? []).filter((v) => v.playerIds.includes(p.id));

  return (
    <Screen title={p.shortName}>
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.lg }}>
        <MediaImage
          imageKey={p.imageKey}
          icon="person"
          scrim
          style={{ height: 280, borderRadius: 0, justifyContent: 'flex-end' }}
        >
          <View style={{ padding: spacing.xl, gap: 2 }}>
            <Text variant="displayXl" tone="onMedia" style={{ opacity: 0.9 }}>
              {p.number}
            </Text>
            <Text variant="displayL" tone="onMedia">
              {p.name}
            </Text>
            <Text variant="callout" tone="onMedia" style={{ opacity: 0.8 }}>
              {p.role} · {p.nationality}
            </Text>
          </View>
        </MediaImage>

        <Button
          label={fav ? 'Favorito' : 'Seguir jogador'}
          icon={fav ? 'heart' : 'heart-outline'}
          variant={fav ? 'secondary' : 'primary'}
          onPress={() => toggleFavoritePlayer(p.id)}
          fullWidth
          accessibilityHint="Jogadores favoritos personalizam o Para você na Home"
        />

        <View style={{ paddingVertical: 8 }}>
          <Text variant="overline" tone="tertiary" style={{ marginBottom: spacing.md }}>
            Temporada 2026 · demo
          </Text>
          <View style={{ flexDirection: 'row' }}>
            {stats.map(([l, v]) => (
              <View key={l} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                <Text variant="displayXl">{v}</Text>
                <Text variant="footnote" tone="secondary" align="center">
                  {l}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingVertical: 8 }}>
          <View style={{ gap: spacing.sm }}>
            {[
              ['Idade', `${age(p.birthDate)} anos (${formatFullDate(p.birthDate)})`],
              ['Altura', `${(p.heightCm / 100).toFixed(2).replace('.', ',')} m`],
              ['Pé preferido', p.preferredFoot],
              ['No clube desde', String(p.joinedYear)],
            ].map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="caption" tone="secondary">
                  {k}
                </Text>
                <Text variant="callout">{v}</Text>
              </View>
            ))}
            <Text variant="body" tone="secondary" style={{ marginTop: spacing.sm }}>
              {p.bio}
            </Text>
          </View>
        </View>
      </View>

      {relatedNews.length > 0 && (
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Notícias" />
          <HList
            data={relatedNews}
            itemWidth={260}
            keyOf={(n) => n.id}
            renderItem={(n) => (
              <NewsCard article={n} onPress={() => navigation.navigate('NewsDetail', { articleId: n.id })} />
            )}
          />
        </View>
      )}
      {relatedVideos.length > 0 && (
        <View style={{ marginTop: spacing.xxl }}>
          <SectionHeader title="Vídeos" />
          <HList
            data={relatedVideos}
            itemWidth={240}
            keyOf={(v) => v.id}
            renderItem={(v) => (
              <VideoCard video={v} onPress={() => navigation.navigate('VideoDetail', { videoId: v.id })} />
            )}
          />
        </View>
      )}
    </Screen>
  );
}
