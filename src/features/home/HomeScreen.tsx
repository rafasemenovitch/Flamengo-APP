import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { View } from 'react-native';

import { Card, EmptyState, ErrorState, Screen, SectionHeader, Skeleton, useTheme } from '@/design-system';
import { HList, NewsCard, VideoCard } from '@/features/shared/ContentCards';
import { PollCard, PredictionCard, QuizCard } from '@/features/shared/Engagement';
import { StandingsTable } from '@/features/shared/MatchUI';
import { useAsync } from '@/hooks/useAsync';
import { useDemoScenario, useLiveMatch } from '@/hooks/useMatch';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { DevScenarioSwitcher, HomeHeader, MatchdayBanner, QuickActions } from './HomeParts';
import { HeroMatchCard } from './HeroMatchCard';

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function HomeScreen() {
  const navigation = useNavigation();
  const { spacing, layout } = useTheme();
  const { profile } = useAppState();
  const [scenario, setScenario] = useDemoScenario();

  const featured = useLiveMatch(() => services.matches.getFeaturedMatch(), [scenario], { alerts: true });
  const news = useAsync(() => services.news.getLatest(6));
  const videos = useAsync(() => services.flatv.getFeatured(6));
  const standings = useAsync(() => services.matches.getStandings('brasileirao'), [featured.data?.status === 'finished']);
  const notifications = useAsync(() => services.profile.getNotifications());
  const forYou = useAsync(
    () => services.recommendations.getForYou({ favoritePlayerIds: profile?.favoritePlayerIds ?? [], interests: profile?.interests ?? [] }),
    [profile?.favoritePlayerIds.join(','), profile?.interests.join(',')]
  );

  const match = featured.data;
  const matchday = !!match && match.status === 'scheduled' && isToday(match.kickoff);
  const plan = useAsync(async () => (matchday && match ? services.stadium.getMatchDayPlan(match.id) : undefined), [matchday, match?.id]);

  // Ao voltar para a Home (ex.: depois de ler as notificações), atualiza o badge.
  const refreshNotifications = notifications.refresh;
  useFocusEffect(
    useCallback(() => {
      refreshNotifications();
    }, [refreshNotifications])
  );

  const refreshing = featured.refreshing || news.refreshing || videos.refreshing;
  const onRefresh = useCallback(() => {
    featured.refresh();
    news.refresh();
    videos.refresh();
    standings.refresh();
    forYou.refresh();
    notifications.refresh();
  }, [featured, news, videos, standings, forYou, notifications]);

  const unread = notifications.data?.filter((n) => !n.read).length ?? 0;
  const section = { marginTop: spacing.xxl };

  return (
    <Screen reserveFab refreshing={refreshing} onRefresh={onRefresh}>
      <HomeHeader unread={unread} />
      <DevScenarioSwitcher value={scenario} onChange={setScenario} />

      {featured.error ? (
        <View style={{ paddingHorizontal: layout.gutter }}>
          <Card>
            <ErrorState compact title="Não carregamos o próximo jogo" onRetry={featured.reload} />
          </Card>
        </View>
      ) : (
        <HeroMatchCard match={match} loading={featured.loading} />
      )}

      <View style={{ marginTop: spacing.xl }}>
        <QuickActions matchday={matchday} />
      </View>

      {matchday && match && (
        <View style={{ marginTop: spacing.xl }}>
          <MatchdayBanner match={match} plan={plan.data} />
        </View>
      )}

      {match?.status === 'finished' && match.manOfTheMatchPollId && (
        <View style={[section, { paddingHorizontal: layout.gutter }]}>
          <PollCard pollId={match.manOfTheMatchPollId} />
        </View>
      )}

      <View style={section}>
        <SectionHeader title="Últimas notícias" onAction={() => navigation.navigate('News')} />
        {news.error ? (
          <ErrorState compact onRetry={news.reload} />
        ) : (
          <HList data={news.data} loading={news.loading} itemWidth={280} keyOf={(n) => n.id} renderItem={(n) => <NewsCard article={n} onPress={() => navigation.navigate('NewsDetail', { articleId: n.id })} />} />
        )}
      </View>

      <View style={section}>
        <SectionHeader title="FlaTV" subtitle="Vídeos em destaque" onAction={() => navigation.navigate('FlaTV')} />
        {videos.error ? (
          <ErrorState compact onRetry={videos.reload} />
        ) : (
          <HList data={videos.data} loading={videos.loading} itemWidth={260} keyOf={(v) => v.id} renderItem={(v) => <VideoCard video={v} onPress={() => navigation.navigate('VideoDetail', { videoId: v.id })} />} />
        )}
      </View>

      <View style={section}>
        <SectionHeader title="Para você" subtitle="Com base nos seus jogadores favoritos e interesses" />
        {forYou.data?.length === 0 ? (
          <EmptyState compact title="Escolha seus favoritos" message="Siga jogadores no seu perfil para receber recomendações." actionLabel="Ir para o perfil" onAction={() => navigation.navigate('Tabs', { screen: 'Perfil' })} />
        ) : (
          <HList
            data={forYou.data}
            loading={forYou.loading}
            itemWidth={240}
            keyOf={(r) => `${r.kind}-${r.item.id}`}
            renderItem={(r) =>
              r.kind === 'video' ? (
                <VideoCard video={r.item} reason={r.reason} onPress={() => navigation.navigate('VideoDetail', { videoId: r.item.id })} />
              ) : (
                <View style={{ gap: 6 }}>
                  <NewsCard article={r.item} onPress={() => navigation.navigate('NewsDetail', { articleId: r.item.id })} />
                </View>
              )
            }
          />
        )}
      </View>

      <View style={[section, { paddingHorizontal: layout.gutter }]}>
        <View style={{ marginHorizontal: -layout.gutter }}>
          <SectionHeader title="Brasileirão" subtitle="Classificação resumida" onAction={() => navigation.navigate('Standings', { competitionId: 'brasileirao' })} actionLabel="Tabela" />
        </View>
        <Card padding="sm">
          {standings.loading || !standings.data ? <Skeleton height={220} /> : <StandingsTable table={standings.data} compact />}
        </Card>
      </View>

      <View style={[section, { paddingHorizontal: layout.gutter, gap: spacing.lg }]}>
        <View style={{ marginHorizontal: -layout.gutter, marginBottom: -spacing.sm }}>
          <SectionHeader title="Jogue com a Nação" subtitle="Pontos virtuais, sem apostas" onAction={() => navigation.navigate('Gamification')} actionLabel="Meus pontos" />
        </View>
        {match && match.status === 'scheduled' && <PredictionCard match={match} />}
        <PollCard />
        <QuizCard />
      </View>
    </Screen>
  );
}
