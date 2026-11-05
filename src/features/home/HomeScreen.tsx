import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';

import {
  Badge,
  Card,
  ClubCrest,
  DemoBadge,
  ErrorState,
  ListGroup,
  ListItem,
  Screen,
  SectionHeader,
  Skeleton,
  TeamCrest,
  Text,
  useTheme,
} from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { IS_DEMO, services } from '@/services';
import { formatMatchDate } from '@/utils/format';

/**
 * Home da FASE 1: valida a fundação (tema, serviços, rotas). A Home completa
 * (hero com 3 estados, atalhos, notícias, FlaTV...) chega na Fase 2.
 */
export function HomeScreen() {
  const navigation = useNavigation();
  const { spacing, layout } = useTheme();
  const featured = useAsync(() => services.matches.getFeaturedMatch());

  const routes: Array<{ title: string; icon: Parameters<typeof ListItem>[0]['icon']; go: () => void }> = [
    { title: 'Detalhe da partida', icon: 'stats-chart-outline', go: () => navigation.navigate('MatchDetail', { matchId: 'm-bra-33' }) },
    { title: 'Perfil de jogador', icon: 'person-outline', go: () => navigation.navigate('PlayerProfile', { playerId: 'p10' }) },
    { title: 'Notícia', icon: 'newspaper-outline', go: () => navigation.navigate('NewsDetail', { articleId: 'n1' }) },
    { title: 'Vídeo (FlaTV)', icon: 'play-circle-outline', go: () => navigation.navigate('VideoDetail', { videoId: 'v1' }) },
    { title: 'Carteira de ingressos', icon: 'wallet-outline', go: () => navigation.navigate('TicketWallet') },
    { title: 'Modo Maracanã', icon: 'location-outline', go: () => navigation.navigate('StadiumMode') },
    { title: 'Loja', icon: 'bag-handle-outline', go: () => navigation.navigate('Store') },
    { title: 'Produto', icon: 'shirt-outline', go: () => navigation.navigate('Product', { productId: 'pr1' }) },
    { title: 'Carrinho', icon: 'cart-outline', go: () => navigation.navigate('Cart') },
    { title: 'Sócio-Torcedor', icon: 'card-outline', go: () => navigation.navigate('Membership') },
    { title: 'Rankings', icon: 'podium-outline', go: () => navigation.navigate('Rankings') },
    { title: 'Passaporte Rubro-Negro', icon: 'book-outline', go: () => navigation.navigate('Passport') },
    { title: 'Configurações', icon: 'settings-outline', go: () => navigation.navigate('Settings') },
  ];

  const m = featured.data;

  return (
    <Screen reserveFab refreshing={featured.refreshing} onRefresh={featured.refresh}>
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: spacing.xl, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <ClubCrest size={40} />
          <Text variant="display">Flamengo App</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Badge label="Fase 1 · Fundação" tone="brand" />
          {IS_DEMO && <DemoBadge label="Modo demo" />}
        </View>
      </View>

      <View style={{ paddingHorizontal: layout.gutter, marginTop: spacing.xl }}>
        {featured.loading ? (
          <Skeleton height={120} radius={20} />
        ) : featured.error || !m ? (
          <Card>
            <ErrorState compact onRetry={featured.reload} />
          </Card>
        ) : (
          <Card variant="elevated" onPress={() => navigation.navigate('MatchDetail', { matchId: m.id })} accessibilityLabel="Próximo jogo">
            <View style={{ gap: spacing.md }}>
              <Text variant="overline" tone="brand">
                {m.stage} · teste do MatchesService
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TeamCrest shortName={m.homeTeam.code} color={m.homeTeam.color} size={44} />
                <Text variant="h2">
                  {m.score ? `${m.score.home} × ${m.score.away}` : '×'}
                </Text>
                <TeamCrest shortName={m.awayTeam.code} color={m.awayTeam.color} size={44} />
              </View>
              <Text variant="caption" tone="secondary" align="center">
                {m.homeTeam.shortName} × {m.awayTeam.shortName} · {formatMatchDate(m.kickoff)} · {m.venue.name}
              </Text>
            </View>
          </Card>
        )}
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Rotas internas" subtitle="Todas já navegáveis; conteúdo completo nas Fases 2 e 3" />
        <ListGroup>
          {routes.map((r) => (
            <ListItem key={r.title} title={r.title} icon={r.icon} onPress={r.go} />
          ))}
        </ListGroup>
      </View>
    </Screen>
  );
}
