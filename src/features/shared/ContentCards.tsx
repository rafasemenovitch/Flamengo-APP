import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { PressableScale, Skeleton, Text, TreatedImage, useTheme, withAlpha } from '@/design-system';
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

/** Rolagem horizontal com gutter e skeleton (usada na FlaTV). */
export function HList<T>({
  data,
  loading,
  renderItem,
  keyOf,
  itemWidth,
  skeletonHeight = 158,
}: {
  data: T[] | undefined;
  loading?: boolean;
  renderItem: (item: T) => ReactNode;
  keyOf: (item: T) => string;
  itemWidth: number;
  skeletonHeight?: number;
}) {
  const { layout, radius } = useTheme();
  if (loading || !data) {
    return (
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: layout.gutter }}>
        <Skeleton width={itemWidth} height={skeletonHeight} radius={radius.l} />
        <Skeleton width={itemWidth} height={skeletonHeight} radius={radius.l} />
      </View>
    );
  }
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={keyOf}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 12 }}
      snapToInterval={itemWidth + 12}
      decelerationRate="fast"
      renderItem={({ item }) => <View style={{ width: itemWidth }}>{renderItem(item)}</View>}
    />
  );
}

/** Manchete principal (editorial): imagem 16:10, categoria, título grande. */
export function NewsLead({ article, onPress }: { article: NewsArticle; onPress: () => void }) {
  const { layout, radius } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`Notícia: ${article.title}`}
      scaleTo={0.99}
      style={{ paddingHorizontal: layout.gutter, gap: 12 }}
    >
      <TreatedImage
        imageKey={article.imageKey}
        aspect="wide"
        style={{ aspectRatio: 16 / 10, borderRadius: radius.s }}
      />
      <View style={{ gap: 6 }}>
        <Text variant="overline" tone="secondary">
          {CATEGORY_LABEL[article.category]}
        </Text>
        <Text variant="titleL">{article.title}</Text>
        <Text variant="bodyS" tone="tertiary">
          {article.readMinutes} min de leitura · {formatRelative(article.publishedAt)}
        </Text>
      </View>
    </PressableScale>
  );
}

/** Linha de notícia com miniatura 72×72 (também usada no "Para você"). */
export function NewsRow({
  title,
  imageKey,
  meta,
  reason,
  onPress,
  video,
}: {
  title: string;
  imageKey: string;
  meta: string;
  reason?: string;
  onPress: () => void;
  video?: boolean;
}) {
  const { colors, layout, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: layout.gutter,
        paddingVertical: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <TreatedImage
        imageKey={imageKey}
        aspect="square"
        style={{ width: 72, height: 72, borderRadius: radius.s }}
      >
        {video && (
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="play" size={20} color={colors.inkOnRed} />
          </View>
        )}
      </TreatedImage>
      <View style={{ flex: 1, gap: 4, justifyContent: 'center' }}>
        <Text variant="titleS" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="bodyS" tone={reason ? 'tertiary' : 'secondary'} numberOfLines={1}>
          {reason ?? meta}
        </Text>
      </View>
    </Pressable>
  );
}

/** Cartão de vídeo da FlaTV: 280×158, raio 16, play central, duração no canto. */
export function VideoTile({
  video,
  onPress,
  width = 280,
}: {
  video: Video;
  onPress: () => void;
  width?: number;
}) {
  const { colors, radius } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`Vídeo: ${video.title}, ${formatDuration(video.durationSec)}`}
      style={{ width, gap: 8 }}
    >
      <TreatedImage
        imageKey={video.imageKey}
        aspect="video"
        style={{ width, height: (width * 158) / 280, borderRadius: radius.l }}
      >
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="play" size={32} color={colors.inkOnRed} />
        </View>
        <View
          style={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            backgroundColor: withAlpha(colors.bgCanvas, 0.7),
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <Text variant="labelM" tone="onMedia">
            {formatDuration(video.durationSec)}
          </Text>
        </View>
      </TreatedImage>
      <Text variant="titleS" numberOfLines={2}>
        {video.title}
      </Text>
      {video.membersOnly && (
        <Text variant="bodyS" tone="brand">
          Exclusivo sócio
        </Text>
      )}
    </PressableScale>
  );
}

/** @deprecated use NewsLead/NewsRow. Mantido nas telas ainda não migradas. */
export function NewsCard({
  article,
  onPress,
  wide,
}: {
  article: NewsArticle;
  onPress: () => void;
  wide?: boolean;
}) {
  const { radius } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityLabel={`Notícia: ${article.title}`} style={{ gap: 8 }}>
      <TreatedImage
        imageKey={article.imageKey}
        aspect="wide"
        style={{ height: wide ? 200 : 150, borderRadius: radius.s }}
      />
      <Text variant="overline" tone="secondary">
        {CATEGORY_LABEL[article.category]}
      </Text>
      <Text variant="titleS" numberOfLines={2}>
        {article.title}
      </Text>
      <Text variant="bodyS" tone="tertiary">
        {article.readMinutes} min de leitura · {formatRelative(article.publishedAt)}
      </Text>
    </PressableScale>
  );
}

/** @deprecated use VideoTile. */
export function VideoCard({
  video,
  onPress,
  reason,
}: {
  video: Video;
  onPress: () => void;
  reason?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <VideoTile video={video} onPress={onPress} width={320} />
      <Text variant="bodyS" tone="tertiary">
        {reason ?? `${formatCompact(video.views)} visualizações · ${formatRelative(video.publishedAt)}`}
      </Text>
    </View>
  );
}
