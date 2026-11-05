import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Badge, Card, MediaImage, SkeletonCard, Text, useTheme } from '@/design-system';
import type { ContentCategory, NewsArticle, Video } from '@/types/content';
import { formatCompact, formatDuration, formatRelative } from '@/utils/format';

export const CATEGORY_LABEL: Record<ContentCategory, string> = {
  jogos: 'Jogos',
  elenco: 'Elenco',
  bastidores: 'Bastidores',
  base: 'Base',
  clube: 'Clube',
  socio: 'Sócio',
  loja: 'Loja',
  feminino: 'Feminino',
};

/** Carrossel horizontal com espaçamento do layout e skeleton embutido. */
export function HList<T>({
  data,
  loading,
  renderItem,
  keyOf,
  itemWidth,
  skeletonHeight = 140,
}: {
  data: T[] | undefined;
  loading?: boolean;
  renderItem: (item: T) => ReactNode;
  keyOf: (item: T) => string;
  itemWidth: number;
  skeletonHeight?: number;
}) {
  const { layout, spacing } = useTheme();
  if (loading || !data) {
    return (
      <View style={{ flexDirection: 'row', gap: spacing.md, paddingHorizontal: layout.gutter }}>
        <SkeletonCard width={itemWidth} imageHeight={skeletonHeight} />
        <SkeletonCard width={itemWidth} imageHeight={skeletonHeight} />
      </View>
    );
  }
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={keyOf}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: spacing.md }}
      snapToInterval={itemWidth + spacing.md}
      decelerationRate="fast"
      renderItem={({ item }) => <View style={{ width: itemWidth }}>{renderItem(item)}</View>}
    />
  );
}

export function NewsCard({ article, onPress, wide }: { article: NewsArticle; onPress: () => void; wide?: boolean }) {
  const { spacing, radius } = useTheme();
  return (
    <Card onPress={onPress} padding="none" accessibilityLabel={`Notícia: ${article.title}`}>
      <MediaImage imageKey={article.imageKey} icon="newspaper-outline" style={{ height: wide ? 180 : 140, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }}>
        <Badge label={CATEGORY_LABEL[article.category]} tone="onMedia" style={{ position: 'absolute', top: 10, left: 10 }} />
      </MediaImage>
      <View style={{ padding: spacing.md, gap: spacing.xs }}>
        <Text variant="title" numberOfLines={2}>
          {article.title}
        </Text>
        <Text variant="footnote" tone="tertiary">
          {formatRelative(article.publishedAt)} · {article.readMinutes} min de leitura
        </Text>
      </View>
    </Card>
  );
}

export function VideoCard({ video, onPress, reason }: { video: Video; onPress: () => void; reason?: string }) {
  const { spacing, radius, colors } = useTheme();
  return (
    <Card onPress={onPress} padding="none" accessibilityLabel={`Vídeo: ${video.title}, ${formatDuration(video.durationSec)}`}>
      <MediaImage imageKey={video.imageKey} icon="videocam-outline" scrim style={{ height: 140, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }}>
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="play" size={20} color={colors.onPrimary} style={{ marginLeft: 3 }} />
          </View>
        </View>
        <Badge label={formatDuration(video.durationSec)} tone="onMedia" style={{ position: 'absolute', bottom: 10, right: 10 }} />
        {video.membersOnly && <Badge label="Sócio" tone="solidBrand" icon="star" style={{ position: 'absolute', top: 10, left: 10 }} />}
      </MediaImage>
      <View style={{ padding: spacing.md, gap: spacing.xs }}>
        {reason && (
          <Text variant="footnote" tone="brand" numberOfLines={1}>
            {reason}
          </Text>
        )}
        <Text variant="title" numberOfLines={2}>
          {video.title}
        </Text>
        <Text variant="footnote" tone="tertiary">
          {formatCompact(video.views)} visualizações · {formatRelative(video.publishedAt)}
        </Text>
      </View>
    </Card>
  );
}
