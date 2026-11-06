import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState, ErrorState, Screen, SegmentedControl, Skeleton, useTheme } from '@/design-system';
import { CATEGORY_LABEL, NewsCard, VideoCard } from '@/features/shared/ContentCards';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import type { ContentCategory } from '@/types/content';

type Filter = 'todas' | ContentCategory;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  ...(['jogos', 'elenco', 'bastidores', 'base', 'socio', 'feminino'] as ContentCategory[]).map((c) => ({
    key: c,
    label: CATEGORY_LABEL[c],
  })),
];

export function NewsListScreen() {
  const navigation = useNavigation();
  const { spacing, layout } = useTheme();
  const [filter, setFilter] = useState<Filter>('todas');
  const q = useAsync(
    () => (filter === 'todas' ? services.news.getLatest(50) : services.news.getByCategory(filter)),
    [filter]
  );
  return (
    <Screen title="Notícias" refreshing={q.refreshing} onRefresh={q.refresh}>
      <SegmentedControl
        segments={FILTERS}
        value={filter}
        onChange={setFilter}
        accessibilityLabel="Categorias"
      />
      <View style={{ paddingHorizontal: layout.gutter, marginTop: spacing.lg, gap: spacing.lg }}>
        {q.loading ? (
          [0, 1].map((i) => <Skeleton key={i} height={260} radius={20} />)
        ) : q.error ? (
          <ErrorState compact onRetry={q.reload} />
        ) : q.data?.length === 0 ? (
          <EmptyState compact icon="newspaper-outline" title="Nenhuma notícia nesta categoria" />
        ) : (
          q.data?.map((n) => (
            <NewsCard
              key={n.id}
              article={n}
              wide
              onPress={() => navigation.navigate('NewsDetail', { articleId: n.id })}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

export function FlaTVScreen() {
  const navigation = useNavigation();
  const { spacing, layout } = useTheme();
  const [filter, setFilter] = useState<Filter>('todas');
  const q = useAsync(() => services.flatv.getVideos(filter === 'todas' ? undefined : filter), [filter]);
  return (
    <Screen title="FlaTV" refreshing={q.refreshing} onRefresh={q.refresh}>
      <SegmentedControl
        segments={FILTERS}
        value={filter}
        onChange={setFilter}
        accessibilityLabel="Categorias"
      />
      <View style={{ paddingHorizontal: layout.gutter, marginTop: spacing.lg, gap: spacing.lg }}>
        {q.loading ? (
          [0, 1].map((i) => <Skeleton key={i} height={240} radius={20} />)
        ) : q.error ? (
          <ErrorState compact onRetry={q.reload} />
        ) : q.data?.length === 0 ? (
          <EmptyState compact icon="videocam-outline" title="Nenhum vídeo nesta categoria" />
        ) : (
          q.data?.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              onPress={() => navigation.navigate('VideoDetail', { videoId: v.id })}
            />
          ))
        )}
      </View>
    </Screen>
  );
}
