import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Card, ErrorState, MediaImage, ProgressBar, Screen, SectionHeader, Skeleton, Text, useTheme } from '@/design-system';
import { CATEGORY_LABEL, VideoCard } from '@/features/shared/ContentCards';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { formatCompact, formatDuration, formatRelative } from '@/utils/format';

/** FlaTV. Sem vídeos oficiais: o "player" simula a reprodução sobre um placeholder. */
export function VideoDetailScreen({ route }: RootScreenProps<'VideoDetail'>) {
  const navigation = useNavigation();
  const { colors, spacing, layout, radius } = useTheme();
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

  if (q.loading) return <Screen title="FlaTV"><View style={{ padding: layout.gutter, gap: spacing.lg }}><Skeleton height={210} radius={radius.lg} /><Skeleton height={80} /></View></Screen>;
  if (q.error || !q.data) return <Screen title="FlaTV" scroll={false}><ErrorState onRetry={q.reload} /></Screen>;
  const v = q.data;

  return (
    <Screen title="FlaTV">
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.lg }}>
        <Pressable onPress={() => setPlaying((p) => !p)} accessibilityRole="button" accessibilityLabel={playing ? 'Pausar' : 'Reproduzir'}>
          <MediaImage imageKey={v.imageKey} icon="videocam-outline" scrim style={{ aspectRatio: 16 / 9, borderRadius: radius.lg }}>
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={playing ? 'pause' : 'play'} size={28} color={colors.onPrimary} style={{ marginLeft: playing ? 0 : 3 }} />
              </View>
            </View>
            <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md, gap: 6 }}>
              <ProgressBar value={pos / v.durationSec} height={4} color={colors.primary} track="rgba(255,255,255,0.25)" />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="footnote" tone="onMedia">{formatDuration(pos)}</Text>
                <Text variant="footnote" tone="onMedia">{formatDuration(v.durationSec)}</Text>
              </View>
            </View>
            <Badge label="Player demonstrativo" tone="onMedia" style={{ position: 'absolute', top: spacing.md, left: spacing.md }} />
          </MediaImage>
        </Pressable>

        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Badge label={CATEGORY_LABEL[v.category]} tone="brand" />
            {v.membersOnly && <Badge label="Exclusivo sócio" tone="solidBrand" icon="star" />}
          </View>
          <Text variant="h2">{v.title}</Text>
          <Text variant="caption" tone="secondary">{formatCompact(v.views)} visualizações · {formatRelative(v.publishedAt)}</Text>
          <Text variant="body" tone="secondary">{v.description}</Text>
        </View>
        {v.matchId && (
          <Card onPress={() => navigation.navigate('MatchDetail', { matchId: v.matchId! })} accessibilityLabel="Ver a partida">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Ionicons name="football" size={22} color={colors.primaryText} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>Ver estatísticas da partida</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </Card>
        )}
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="A seguir" />
        <View style={{ paddingHorizontal: layout.gutter, gap: spacing.md }}>
          {more.data?.filter((x) => x.id !== v.id).slice(0, 4).map((x) => (
            <VideoCard key={x.id} video={x} onPress={() => navigation.navigate({ name: 'VideoDetail', params: { videoId: x.id }, key: `video-${x.id}` } as never)} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
