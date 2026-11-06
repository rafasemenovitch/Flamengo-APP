import { useNavigation } from '@react-navigation/native';
import { Share, View } from 'react-native';

import {
  Badge,
  ErrorState,
  IconButton,
  MediaImage,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@/design-system';
import { CATEGORY_LABEL, HList, NewsCard } from '@/features/shared/ContentCards';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { formatMatchDate } from '@/utils/format';

export function NewsDetailScreen({ route }: RootScreenProps<'NewsDetail'>) {
  const navigation = useNavigation();
  const { spacing, layout, radius } = useTheme();
  const q = useAsync(() => services.news.getArticle(route.params.articleId), [route.params.articleId]);
  const more = useAsync(() => services.news.getLatest(8));

  if (q.loading)
    return (
      <Screen title="Notícia">
        <View style={{ padding: layout.gutter, gap: spacing.lg }}>
          <Skeleton height={220} radius={radius.xl} />
          <Skeleton height={28} />
          <Skeleton height={200} />
        </View>
      </Screen>
    );
  if (q.error || !q.data)
    return (
      <Screen title="Notícia" scroll={false}>
        <ErrorState onRetry={q.reload} />
      </Screen>
    );
  const a = q.data;

  return (
    <Screen
      title={CATEGORY_LABEL[a.category]}
      headerRight={
        <IconButton
          icon="share-outline"
          variant="plain"
          accessibilityLabel="Compartilhar"
          onPress={() => Share.share({ message: `${a.title} — Flamengo App (demo)` })}
        />
      }
    >
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.lg }}>
        <MediaImage
          imageKey={a.imageKey}
          icon="newspaper-outline"
          style={{ height: 220, borderRadius: radius.xl }}
        />
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Badge label={CATEGORY_LABEL[a.category]} tone="brand" />
            <Badge label="Texto demonstrativo" tone="demo" />
          </View>
          <Text variant="h1">{a.title}</Text>
          <Text variant="caption" tone="secondary">
            {a.author} · {formatMatchDate(a.publishedAt)} · {a.readMinutes} min de leitura
          </Text>
        </View>
        <Text variant="title" tone="secondary">
          {a.summary}
        </Text>
        {a.body.map((p, i) => (
          <Text key={i} variant="body" style={{ lineHeight: 25 }}>
            {p}
          </Text>
        ))}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {a.tags.map((t) => (
            <Badge key={t} label={`#${t}`} tone="neutral" />
          ))}
        </View>
      </View>
      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Leia também" />
        <HList
          data={more.data?.filter((n) => n.id !== a.id)}
          loading={more.loading}
          itemWidth={260}
          keyOf={(n) => n.id}
          renderItem={(n) => (
            <NewsCard
              article={n}
              onPress={() =>
                navigation.navigate({
                  name: 'NewsDetail',
                  params: { articleId: n.id },
                  key: `news-${n.id}`,
                } as never)
              }
            />
          )}
        />
      </View>
    </Screen>
  );
}
