import { useNavigation } from '@react-navigation/native';
import { Platform, View } from 'react-native';

import {
  Button,
  Countdown,
  Crest,
  LiveIndicator,
  Monogram,
  Skeleton,
  Text,
  TreatedImage,
  useTheme,
} from '@/design-system';
import { competitionName, ScoreBoard } from '@/features/shared/MatchUI';
import type { MatchDetail } from '@/types/match';
import { formatDayLabel, formatTime } from '@/utils/format';

/**
 * LABORATÓRIO DO CARD DO JOGO (estudo, não é a Home oficial).
 *
 * Cinco layouts alternativos para o card do próximo jogo, com as mesmas fontes e componentes do
 * card de hoje. Só aparecem na web com `?hero=1` … `?hero=5` no endereço; sem isso a Home usa
 * o HeroMatchCard de sempre. Prints: docs/screens/card-do-jogo/.
 */
export const HERO_VARIANT: number | null = (() => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const n = Number(new URLSearchParams(window.location.search).get('hero'));
  return n >= 1 && n <= 5 ? n : null;
})();

export function HeroVariant({
  variant,
  match,
  loading,
}: {
  variant: number;
  match?: MatchDetail;
  loading: boolean;
}) {
  if (loading || !match) return <Skeleton height={300} radius={0} />;
  switch (variant) {
    case 1:
      return <SideBySide match={match} />;
    case 2:
      return <Typographic match={match} />;
    case 3:
      return <PhotoAndPanel match={match} />;
    case 4:
      return <CountdownFirst match={match} />;
    default:
      return <InsetCard match={match} />;
  }
}

const isPre = (m: MatchDetail) => m.status === 'scheduled' || m.status === 'postponed';

/** Os mesmos botões do card de hoje, por momento do jogo. */
function Actions({
  match,
  onMedia = true,
  onRed,
}: {
  match: MatchDetail;
  onMedia?: boolean;
  /** Sobre o bloco vermelho liso: o botão principal fica branco. */
  onRed?: boolean;
}) {
  const navigation = useNavigation();
  const open = () => navigation.navigate('MatchDetail', { matchId: match.id });
  const second = onMedia ? 'onMedia' : 'secondary';
  if (isPre(match))
    return (
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {match.ticketsOnSale && (
          <Button
            label="Comprar ingresso"
            variant={onRed ? 'light' : 'primary'}
            onPress={() => navigation.navigate('TicketPurchase', { matchId: match.id })}
            style={{ flex: 1.4 }}
          />
        )}
        <Button label="Detalhes" variant={second} onPress={open} style={{ flex: 1 }} />
      </View>
    );
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Button
        label="Lance a lance"
        variant={onRed ? 'light' : 'primary'}
        onPress={open}
        style={{ flex: 1.4 }}
      />
      <Button label="Estatísticas" variant={second} onPress={open} style={{ flex: 1 }} />
    </View>
  );
}

/** Contagem antes do jogo; placar depois que a bola rola. */
function Center({ match, size = 'compact' }: { match: MatchDetail; size?: 'hero' | 'compact' }) {
  if (isPre(match)) return <Countdown target={match.kickoff} onMedia size={size} />;
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      {match.status !== 'finished' && <LiveIndicator minute={match.liveMinute} />}
      <Text variant="displayHero" tone="onMedia">
        {match.score?.home ?? 0}–{match.score?.away ?? 0}
      </Text>
    </View>
  );
}

function Meta({ match, align = 'left' }: { match: MatchDetail; align?: 'left' | 'center' }) {
  return (
    <View style={{ gap: 2, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
      <Text variant="displayS" tone="onMedia">
        {competitionName(match.competitionId)}
      </Text>
      <Text variant="bodyM" tone="onMedia" style={{ opacity: 0.8 }}>
        {match.stage}, no {match.venue.name}
      </Text>
    </View>
  );
}

/** 1. Lista de jogo: os dois times em linhas, alinhados à esquerda; a hora grande à direita. */
function SideBySide({ match }: { match: MatchDetail }) {
  const { layout } = useTheme();
  const team = (t: MatchDetail['homeTeam'], dim?: boolean) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Crest team={t} size={40} onMedia />
      <Text variant="displayM" tone="onMedia" style={{ opacity: dim ? 0.75 : 1 }} numberOfLines={1}>
        {t.shortName}
      </Text>
    </View>
  );
  return (
    <TreatedImage imageKey={`hero-${match.id}`} aspect="hero" overlay style={{ height: 340 }}>
      <View style={{ flex: 1, padding: layout.gutter, justifyContent: 'space-between' }}>
        <Meta match={match} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 10 }}>
            {team(match.homeTeam)}
            {team(match.awayTeam, true)}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text variant="displayS" tone="onMedia">
              {formatTime(match.kickoff)}
            </Text>
            <Text variant="bodyM" tone="onMedia" style={{ opacity: 0.8 }}>
              {formatDayLabel(match.kickoff)}
            </Text>
          </View>
        </View>
        <Center match={match} />
        <Actions match={match} />
      </View>
    </TreatedImage>
  );
}

/** 2. Tipográfico: bloco vermelho sem foto, confronto em duas linhas, escudos empilhados. */
function Typographic({ match }: { match: MatchDetail }) {
  const { layout, colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.bgRed, padding: layout.gutter, gap: 20, overflow: 'hidden' }}>
      <Monogram
        color="white"
        width={220}
        opacity={0.08}
        style={{ position: 'absolute', right: -50, top: -30 }}
      />
      <Text variant="overline" tone="onMedia" style={{ opacity: 0.8 }}>
        {competitionName(match.competitionId)} · {match.stage}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Text variant="displayL" tone="onMedia">
            {match.homeTeam.shortName}
          </Text>
          <Text variant="displayL" tone="onMedia" style={{ opacity: 0.7 }}>
            × {match.awayTeam.shortName}
          </Text>
        </View>
        <View style={{ gap: 8 }}>
          <Crest team={match.homeTeam} size={44} onMedia />
          <Crest team={match.awayTeam} size={44} onMedia />
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 16,
          borderTopWidth: 1,
          borderColor: 'rgba(255,255,255,0.25)',
        }}
      >
        <Text variant="displayS" tone="onMedia">
          {formatTime(match.kickoff)}
        </Text>
        <Text variant="bodyM" tone="onMedia" style={{ opacity: 0.8 }}>
          {formatDayLabel(match.kickoff)}, {match.venue.name}
        </Text>
      </View>
      <Center match={match} />
      <Actions match={match} onRed />
    </View>
  );
}

/** 3. Foto e painel: o confronto na foto; embaixo, um painel liso com hora, contagem e ações. */
function PhotoAndPanel({ match }: { match: MatchDetail }) {
  const { layout, colors } = useTheme();
  return (
    <View>
      <TreatedImage imageKey={`hero-${match.id}`} aspect="hero" overlay style={{ height: 230 }}>
        <View style={{ flex: 1, padding: layout.gutter, justifyContent: 'space-between' }}>
          <Meta match={match} />
          <ScoreBoard match={match} onMedia />
        </View>
      </TreatedImage>
      <View style={{ backgroundColor: colors.bgRaised, padding: layout.gutter, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text variant="displayS">{formatTime(match.kickoff)}</Text>
            <Text variant="bodyM" tone="secondary">
              {formatDayLabel(match.kickoff)}
            </Text>
          </View>
          {isPre(match) ? <Countdown target={match.kickoff} size="compact" /> : <Center match={match} />}
        </View>
        <Actions match={match} onMedia={false} />
      </View>
    </View>
  );
}

/** 4. Contagem primeiro: o tempo que falta é o protagonista; o confronto vira uma linha. */
function CountdownFirst({ match }: { match: MatchDetail }) {
  const { layout } = useTheme();
  return (
    <TreatedImage imageKey={`hero-${match.id}`} aspect="hero" overlay style={{ height: 340 }}>
      <View style={{ flex: 1, padding: layout.gutter, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Crest team={match.homeTeam} size={32} onMedia />
          <Text variant="displayS" tone="onMedia" style={{ flex: 1 }} numberOfLines={1}>
            {match.homeTeam.shortName} × {match.awayTeam.shortName}
          </Text>
          <Crest team={match.awayTeam} size={32} onMedia />
        </View>
        <View style={{ gap: 6, alignItems: 'center' }}>
          {isPre(match) && (
            <Text variant="overline" tone="onMedia" style={{ opacity: 0.8 }}>
              Faltam
            </Text>
          )}
          <Center match={match} />
        </View>
        <View style={{ gap: 16 }}>
          <Text variant="bodyM" tone="onMedia" align="center" style={{ opacity: 0.85 }}>
            {competitionName(match.competitionId)} · {formatDayLabel(match.kickoff)},{' '}
            {formatTime(match.kickoff)} · {match.venue.name}
          </Text>
          <Actions match={match} />
        </View>
      </View>
    </TreatedImage>
  );
}

/** 5. Cartão com margem: o card de hoje recolhido, com cantos e respiro dos lados. */
function InsetCard({ match }: { match: MatchDetail }) {
  const { layout, radius } = useTheme();
  return (
    <View style={{ paddingHorizontal: layout.gutter }}>
      <TreatedImage
        imageKey={`hero-${match.id}`}
        aspect="hero"
        overlay
        style={{ height: 330, borderRadius: radius.l, overflow: 'hidden' }}
      >
        <View style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Meta match={match} />
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text variant="displayS" tone="onMedia">
                {formatTime(match.kickoff)}
              </Text>
              <Text variant="bodyM" tone="onMedia" style={{ opacity: 0.8 }}>
                {formatDayLabel(match.kickoff)}
              </Text>
            </View>
          </View>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
              <Crest team={match.homeTeam} size={64} onMedia />
              <Text variant="displayM" tone="onMedia" style={{ opacity: 0.6 }}>
                ×
              </Text>
              <Crest team={match.awayTeam} size={64} onMedia />
            </View>
            <Center match={match} />
          </View>
          <Actions match={match} />
        </View>
      </TreatedImage>
    </View>
  );
}
