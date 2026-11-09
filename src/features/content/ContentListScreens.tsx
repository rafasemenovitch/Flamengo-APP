import { useNavigation, useRoute } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import {
  EmptyState,
  ErrorState,
  FilterBar,
  type FilterValues,
  Screen,
  Skeleton,
  Tabs,
  Text,
  useTheme,
} from '@/design-system';
import { CATEGORY_LABEL, NewsLead, NewsRow, VideoTile } from '@/features/shared/ContentCards';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import type { ContentCategory } from '@/types/content';
import { filterContent, type ContentQuery, type Duration, type Period } from '@/utils/contentFilters';
import { formatDuration, formatRelative } from '@/utils/format';

type Hub = 'noticias' | 'flatv';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'tudo', label: 'Tudo' },
  { key: 'hoje', label: 'Hoje' },
  { key: '7d', label: 'Últimos 7 dias' },
  { key: '30d', label: 'Últimos 30 dias' },
];
const CATEGORIES: { key: 'todas' | ContentCategory; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  ...(['jogos', 'elenco', 'bastidores', 'base', 'socio', 'feminino'] as ContentCategory[]).map((c) => ({
    key: c,
    label: CATEGORY_LABEL[c],
  })),
];
const SORTS = [
  { key: 'recentes', label: 'Mais recentes' },
  { key: 'antigos', label: 'Mais antigos' },
];
const DEFAULT_QUERY: ContentQuery = {
  period: 'tudo',
  category: 'todas',
  sort: 'recentes',
  duration: 'qualquer',
};
const DURATIONS: { key: Duration; label: string }[] = [
  { key: 'qualquer', label: 'Qualquer duração' },
  { key: 'curtos', label: 'Até 5 min' },
  { key: 'longos', label: 'Mais de 5 min' },
];

/**
 * Central de conteúdo (notícias + FlaTV) com filtros de período, categoria,
 * duração e ordem. Aberta pelo "Ver todas" de Notícias e de FlaTV.
 */
export function ContentHubScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { layout } = useTheme();
  const { width } = useWindowDimensions();
  const [hub, setHub] = useState<Hub>(route.name === 'FlaTV' ? 'flatv' : 'noticias');
  const [q, setQ] = useState<ContentQuery>(DEFAULT_QUERY);

  const news = useAsync(() => services.news.getLatest(100));
  const videos = useAsync(() => services.flatv.getVideos());
  const source = hub === 'noticias' ? news : videos;

  const newsItems = useMemo(
    () => filterContent(news.data ?? [], { ...q, duration: 'qualquer' }),
    [q, news.data]
  );
  const videoItems = useMemo(() => filterContent(videos.data ?? [], q), [q, videos.data]);
  const count = hub === 'noticias' ? newsItems.length : videoItems.length;
  const tileWidth = Math.min(width, 600) - layout.gutter * 2;

  return (
    <Screen title="Mídia" refreshing={source.refreshing} onRefresh={source.refresh}>
      <Tabs<Hub>
        segments={[
          { key: 'noticias', label: 'Notícias' },
          { key: 'flatv', label: 'FlaTV' },
        ]}
        value={hub}
        onChange={setHub}
      />
      <View style={{ marginTop: 16 }}>
        <FilterBar
          groups={[
            { key: 'sort', title: 'Ordenar por', options: SORTS },
            { key: 'period', title: 'Período', options: PERIODS },
            { key: 'category', title: 'Categoria', options: CATEGORIES },
            ...(hub === 'flatv' ? [{ key: 'duration', title: 'Duração', options: DURATIONS }] : []),
          ]}
          value={q as unknown as FilterValues}
          defaults={DEFAULT_QUERY as unknown as FilterValues}
          onApply={(v) => setQ(v as unknown as ContentQuery)}
          count={(v) => {
            const cq = v as unknown as ContentQuery;
            return hub === 'noticias'
              ? filterContent(news.data ?? [], { ...cq, duration: 'qualquer' }).length
              : filterContent(videos.data ?? [], cq).length;
          }}
          countLabel={(n) =>
            hub === 'noticias'
              ? `${n} ${n === 1 ? 'notícia' : 'notícias'}`
              : `${n} ${n === 1 ? 'vídeo' : 'vídeos'}`
          }
        />
      </View>

      <View style={{ marginTop: 8 }}>
        {source.loading ? (
          <View style={{ paddingHorizontal: layout.gutter, gap: 16 }}>
            <Skeleton height={220} radius={8} />
            <Skeleton height={72} radius={8} />
          </View>
        ) : source.error ? (
          <ErrorState compact onRetry={source.reload} />
        ) : count === 0 ? (
          <EmptyState compact title="Nada por aqui ainda." message="Tente outro período ou categoria." />
        ) : hub === 'noticias' ? (
          <View style={{ gap: 8 }}>
            {(() => {
              const [lead, ...rest] = newsItems;
              return (
                <>
                  {lead && (
                    <NewsLead
                      article={lead}
                      onPress={() => navigation.navigate('NewsDetail', { articleId: lead.id })}
                    />
                  )}
                  {rest.map((n) => (
                    <NewsRow
                      key={n.id}
                      title={n.title}
                      imageKey={n.imageKey}
                      meta={`${CATEGORY_LABEL[n.category]} · ${n.readMinutes} min · ${formatRelative(n.publishedAt)}`}
                      onPress={() => navigation.navigate('NewsDetail', { articleId: n.id })}
                    />
                  ))}
                </>
              );
            })()}
          </View>
        ) : (
          <View style={{ paddingHorizontal: layout.gutter, gap: 32 }}>
            {videoItems.map((v) => (
              <View key={v.id} style={{ gap: 4 }}>
                <VideoTile
                  video={v}
                  width={tileWidth}
                  onPress={() => navigation.navigate('VideoDetail', { videoId: v.id })}
                />
                <Text variant="bodyS" tone="tertiary">
                  {CATEGORY_LABEL[v.category]} · {formatDuration(v.durationSec)} ·{' '}
                  {formatRelative(v.publishedAt)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

/** Rotas antigas apontam para a central (abrindo na aba certa pelo nome da rota). */
export const NewsListScreen = ContentHubScreen;
export const FlaTVScreen = ContentHubScreen;
