import { useNavigation } from '@react-navigation/native';
import { Share, View } from 'react-native';

import {
  ErrorState,
  IconButton,
  Screen,
  SectionTitle,
  Skeleton,
  Text,
  TreatedImage,
  useTheme,
} from '@/design-system';
import { CATEGORY_LABEL, NewsRow } from '@/features/shared/ContentCards';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { formatRelative } from '@/utils/format';

/** Notícia: foto em sangria, título grande, texto corrido e "Leia também" em linhas. */
export function NewsDetailScreen({ route }: RootScreenProps<'NewsDetail'>) {
  const navigation = useNavigation();
  const { layout } = useTheme();
  const q = useAsync(() => services.news.getArticle(route.params.articleId), [route.params.articleId]);
  const more = useAsync(() => services.news.getLatest(6));

  if (q.loading)
    return (
      <Screen title="Notícia">
        <Skeleton height={240} radius={0} />
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
          onPress={() => Share.share({ message: `${a.title} — Flamengo App` })}
        />
      }
    >
      <TreatedImage imageKey={a.imageKey} aspect="wide" style={{ aspectRatio: 16 / 10 }} />
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: 24, gap: 16 }}>
        <Text variant="displayM">{a.title}</Text>
        <Text variant="bodyS" tone="tertiary">
          {formatRelative(a.publishedAt)} · {a.readMinutes} min
        </Text>
        <Text variant="titleM" tone="secondary">
          {a.summary}
        </Text>
        {a.body.map((p, i) => (
          <Text key={i} variant="bodyL">
            {p}
          </Text>
        ))}
      </View>
      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Leia também" />
        {more.data
          ?.filter((n) => n.id !== a.id)
          .slice(0, 3)
          .map((n) => (
            <NewsRow
              key={n.id}
              title={n.title}
              imageKey={n.imageKey}
              meta={`${n.readMinutes} min · ${formatRelative(n.publishedAt)}`}
              onPress={() =>
                navigation.navigate({
                  name: 'NewsDetail',
                  params: { articleId: n.id },
                  key: `news-${n.id}`,
                } as never)
              }
            />
          ))}
      </View>
    </Screen>
  );
}
