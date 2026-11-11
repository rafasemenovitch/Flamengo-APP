import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  ErrorState,
  ProgressBar,
  Screen,
  SectionTitle,
  Skeleton,
  Text,
  TreatedImage,
  useTheme,
  withAlpha,
} from '@/design-system';
import { NewsRow } from '@/features/shared/ContentCards';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { formatCompact, formatDuration, formatRelative } from '@/utils/format';

/** FlaTV. Sem vídeos oficiais: o "player" simula a reprodução sobre a imagem. */
export function VideoDetailScreen({ route }: RootScreenProps<'VideoDetail'>) {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  const q = useAsync(() => services.flatv.getVideo(route.params.videoId), [route.params.videoId]);
  const more = useAsync(() => services.flatv.getVideos());
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!playing || !q.data) return;
    timer.current = setInterval(() => setPos((p) => (p + 1 >= q.data!.durationSec ? 0 : p + 1)), 1000);
    return () => clearInterval(timer.current);
  }, [playing, q.data]);

  if (q.loading)
    return (
      <Screen title="FlaTV">
        <Skeleton height={220} radius={0} />
      </Screen>
    );
  if (q.error || !q.data)
    return (
      <Screen title="FlaTV" scroll={false}>
        <ErrorState onRetry={q.reload} />
      </Screen>
    );
  const v = q.data;

  return (
    <Screen title="FlaTV">
      <Pressable
        onPress={() => setPlaying((p) => !p)}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pausar' : 'Reproduzir'}
      >
        <TreatedImage imageKey={v.imageKey} aspect="video" overlay style={{ aspectRatio: 16 / 9 }}>
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name={playing ? 'pause' : 'play'} size={48} color={colors.inkOnRed} />
          </View>
          <View style={{ position: 'absolute', left: 16, right: 16, bottom: 12, gap: 6 }}>
            <ProgressBar
              value={pos / v.durationSec}
              height={3}
              color={colors.accent}
              track={withAlpha(colors.inkOnRed, 0.25)}
            />
            <Text variant="labelM" tone="onMedia">
              {formatDuration(pos)} / {formatDuration(v.durationSec)}
            </Text>
          </View>
        </TreatedImage>
      </Pressable>

      <View style={{ paddingHorizontal: layout.gutter, paddingTop: 24, gap: 12 }}>
        {v.membersOnly && (
          <Text variant="overline" tone="brand">
            Exclusivo sócio
          </Text>
        )}
        <Text variant="headline">{v.title}</Text>
        <Text variant="bodyS" tone="tertiary">
          {formatCompact(v.views)} visualizações · {formatRelative(v.publishedAt)}
        </Text>
        {v.matchId && (
          <Button
            label="Ver a partida"
            variant="link"
            onPress={() => navigation.navigate('MatchDetail', { matchId: v.matchId! })}
          />
        )}
      </View>

      <View style={{ marginTop: 32 }}>
        <SectionTitle title="A seguir" />
        {more.data
          ?.filter((x) => x.id !== v.id)
          .slice(0, 4)
          .map((x) => (
            <NewsRow
              key={x.id}
              video
              title={x.title}
              imageKey={x.imageKey}
              meta={formatDuration(x.durationSec)}
              onPress={() =>
                navigation.navigate({
                  name: 'VideoDetail',
                  params: { videoId: x.id },
                  key: `video-${x.id}`,
                } as never)
              }
            />
          ))}
      </View>
    </Screen>
  );
}
