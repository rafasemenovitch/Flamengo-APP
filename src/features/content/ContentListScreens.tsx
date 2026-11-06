import { useNavigation, useRoute } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import {
  Button,
  EmptyState,
  ErrorState,
  Filters,
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
  const [q, setQ] = useState<ContentQuery>({
    period: 'tudo',
    category: 'todas',
    sort: 'recentes',
    duration: 'qualquer',
  });
  const set = (patch: Partial<ContentQuery>) => setQ((cur) => ({ ...cur, ...patch }));

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
    <Screen title="Notícias e FlaTV" refreshing={source.refreshing} onRefresh={source.refresh}>
      <Tabs<Hub>
        segments={[
          { key: 'noticias', label: 'Notícias' },
          { key: 'flatv', label: 'FlaTV' },
        ]}
        value={hub}
        onChange={setHub}
      />
      <View style={{ gap: 8, marginTop: 12 }}>
        <Filters
          accessibilityLabel="Período"
          segments={PERIODS}
          value={q.period}
          onChange={(period) => set({ period })}
        />
        <Filters
          accessibilityLabel="Categoria"
          segments={CATEGORIES}
          value={q.category}
          onChange={(category) => set({ category })}
        />
        {hub === 'flatv' && (
          <Filters
            accessibilityLabel="Duração"
            segments={DURATIONS}
            value={q.duration}
            onChange={(duration) => set({ duration })}
          />
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: layout.gutter,
          marginTop: 16,
        }}
      >
        <Text variant="bodyS" tone="secondary">
          {source.loading
            ? 'Carregando…'
            : `${count} ${hub === 'noticias' ? (count === 1 ? 'notícia' : 'notícias') : count === 1 ? 'vídeo' : 'vídeos'}`}
        </Text>
        <Button
          label={q.sort === 'recentes' ? 'Mais recentes' : 'Mais antigos'}
          variant="link"
          icon={q.sort === 'recentes' ? 'arrow-down' : 'arrow-up'}
          onPress={() => set({ sort: q.sort === 'recentes' ? 'antigos' : 'recentes' })}
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
