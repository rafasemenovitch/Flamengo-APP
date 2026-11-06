import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Animated, View } from 'react-native';

import { EmptyState, ErrorState, Screen, SectionTitle, Skeleton, useTheme } from '@/design-system';
import { HList, NewsLead, NewsRow, VideoTile } from '@/features/shared/ContentCards';
import { PollCard, PredictionCard, QuizCard } from '@/features/shared/Engagement';
import { StandingsTable } from '@/features/shared/MatchUI';
import { useAsync } from '@/hooks/useAsync';
import { useDemoScenario, useLiveMatch } from '@/hooks/useMatch';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { formatDuration, formatRelative } from '@/utils/format';
import { HeroMatchCard } from './HeroMatchCard';
import { DemoControlsSheet, HomeHeader, MatchdayBanner, QuickActions } from './HomeParts';

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

/** Entrada das seções: fade + 12px, escalonada em 40ms, só na primeira carga. */
function Reveal({ index, children, style }: { index: number; children: ReactNode; style?: object }) {
  const reduceMotion = useReduceMotion();
  const { motion } = useTheme();
  const a = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: reduceMotion ? motion.duration.reduced : motion.duration.slow,
      delay: reduceMotion ? 0 : index * 40,
      easing: motion.easing.standard,
      useNativeDriver: true,
    }).start();
  }, [a, index, reduceMotion, motion]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: a,
          transform: [
            { translateY: reduceMotion ? 0 : a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Início (especificação 13.1). */
export function HomeScreen() {
  const navigation = useNavigation();
  const { layout } = useTheme();
  const { profile } = useAppState();
  const [scenario, setScenario] = useDemoScenario();
  const [demoPanel, setDemoPanel] = useState(false);

  const featured = useLiveMatch(() => services.matches.getFeaturedMatch(), [scenario], { alerts: true });
  const news = useAsync(() => services.news.getLatest(4));
  const videos = useAsync(() => services.flatv.getFeatured(6));
  const standings = useAsync(
    () => services.matches.getStandings('brasileirao'),
    [featured.data?.status === 'finished']
  );
  const notifications = useAsync(() => services.profile.getNotifications());
  const forYou = useAsync(
    () =>
      services.recommendations.getForYou({
        favoritePlayerIds: profile?.favoritePlayerIds ?? [],
        interests: profile?.interests ?? [],
      }),
    [profile?.favoritePlayerIds.join(','), profile?.interests.join(',')]
  );

  const match = featured.data;
  const matchday = !!match && match.status === 'scheduled' && isToday(match.kickoff);
  const plan = useAsync(
    async () => (matchday && match ? services.stadium.getMatchDayPlan(match.id) : undefined),
    [matchday, match?.id]
  );

  const refreshNotifications = notifications.refresh;
  useFocusEffect(
    useCallback(() => {
      refreshNotifications();
    }, [refreshNotifications])
  );

  const onRefresh = useCallback(() => {
    featured.refresh();
    news.refresh();
    videos.refresh();
    standings.refresh();
    forYou.refresh();
    notifications.refresh();
  }, [featured, news, videos, standings, forYou, notifications]);

  const unread = notifications.data?.filter((n) => !n.read).length ?? 0;
  const [lead, ...rest] = news.data ?? [];

  return (
    <Screen reserveFab refreshing={featured.refreshing || news.refreshing} onRefresh={onRefresh}>
      <HomeHeader unread={unread} matchday={matchday} onSecretLongPress={() => setDemoPanel(true)} />
      <DemoControlsSheet
        visible={demoPanel}
        value={scenario}
        onChange={setScenario}
        onClose={() => setDemoPanel(false)}
      />

      <View style={{ marginTop: 24 }}>
        {featured.error ? (
          <ErrorState compact onRetry={featured.reload} />
        ) : (
          <HeroMatchCard match={match} loading={featured.loading} />
        )}
      </View>

      <Reveal index={0} style={{ marginTop: 24 }}>
        <QuickActions matchday={matchday} />
      </Reveal>

      {matchday && match && (
        <Reveal index={1} style={{ marginTop: 32 }}>
          <MatchdayBanner match={match} plan={plan.data} />
        </Reveal>
      )}

      {match?.status === 'finished' && match.manOfTheMatchPollId && (
        <Reveal index={1} style={{ marginTop: 48, paddingHorizontal: layout.gutter }}>
          <PollCard pollId={match.manOfTheMatchPollId} />
        </Reveal>
      )}

      <Reveal index={2} style={{ marginTop: 48 }}>
        <SectionTitle title="Notícias" action="Ver todas" onAction={() => navigation.navigate('News')} />
        {news.error ? (
          <ErrorState compact onRetry={news.reload} />
        ) : news.loading || !lead ? (
          <View style={{ paddingHorizontal: layout.gutter, gap: 12 }}>
            <Skeleton height={220} radius={8} />
            <Skeleton height={72} radius={8} />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <NewsLead
              article={lead}
              onPress={() => navigation.navigate('NewsDetail', { articleId: lead.id })}
            />
            <View style={{ marginTop: 8 }}>
              {rest.slice(0, 3).map((n) => (
                <NewsRow
                  key={n.id}
                  title={n.title}
                  imageKey={n.imageKey}
                  meta={`${n.readMinutes} min · ${formatRelative(n.publishedAt)}`}
                  onPress={() => navigation.navigate('NewsDetail', { articleId: n.id })}
                />
              ))}
            </View>
          </View>
        )}
      </Reveal>

      <Reveal index={3} style={{ marginTop: 48 }}>
        <SectionTitle title="FlaTV" action="Ver todos" onAction={() => navigation.navigate('FlaTV')} />
        {videos.error ? (
          <ErrorState compact onRetry={videos.reload} />
        ) : (
          <HList
            data={videos.data}
            loading={videos.loading}
            itemWidth={280}
            keyOf={(v) => v.id}
            renderItem={(v) => (
              <VideoTile video={v} onPress={() => navigation.navigate('VideoDetail', { videoId: v.id })} />
            )}
          />
        )}
      </Reveal>

      <Reveal index={4} style={{ marginTop: 48 }}>
        <SectionTitle title="Para você" subtitle="Pelos seus jogadores favoritos e interesses" />
        {forYou.loading ? (
          <View style={{ paddingHorizontal: layout.gutter }}>
            <Skeleton height={72} radius={8} />
          </View>
        ) : forYou.data?.length === 0 ? (
          <EmptyState
            compact
            title="Escolha seus ídolos."
            message="Siga jogadores no perfil para receber recomendações."
            actionLabel="Ir para o perfil"
            onAction={() => navigation.navigate('Tabs', { screen: 'Perfil' })}
          />
        ) : (
          forYou.data
            ?.slice(0, 4)
            .map((r) =>
              r.kind === 'video' ? (
                <NewsRow
                  key={`v-${r.item.id}`}
                  video
                  title={r.item.title}
                  imageKey={r.item.imageKey}
                  meta={formatDuration(r.item.durationSec)}
                  reason={r.reason.charAt(0).toLowerCase() + r.reason.slice(1)}
                  onPress={() => navigation.navigate('VideoDetail', { videoId: r.item.id })}
                />
              ) : (
                <NewsRow
                  key={`n-${r.item.id}`}
                  title={r.item.title}
                  imageKey={r.item.imageKey}
                  meta={`${r.item.readMinutes} min`}
                  reason={r.reason.charAt(0).toLowerCase() + r.reason.slice(1)}
                  onPress={() => navigation.navigate('NewsDetail', { articleId: r.item.id })}
                />
              )
            )
        )}
      </Reveal>

      <Reveal index={5} style={{ marginTop: 48 }}>
        <SectionTitle
          title="Brasileirão"
          action="Tabela"
          onAction={() => navigation.navigate('Standings', { competitionId: 'brasileirao' })}
        />
        {standings.loading || !standings.data ? (
          <View style={{ paddingHorizontal: layout.gutter }}>
            <Skeleton height={260} radius={8} />
          </View>
        ) : (
          <StandingsTable table={standings.data} compact />
        )}
      </Reveal>

      <Reveal index={6} style={{ marginTop: 48 }}>
        <SectionTitle
          title="Jogue com a Nação"
          subtitle="Pontos virtuais, sem apostas"
          action="Meus pontos"
          onAction={() => navigation.navigate('Gamification')}
        />
        <View style={{ paddingHorizontal: layout.gutter, gap: 32 }}>
          {match && match.status === 'scheduled' && <PredictionCard match={match} />}
          <PollCard />
          <QuizCard />
        </View>
      </Reveal>
    </Screen>
  );
}
