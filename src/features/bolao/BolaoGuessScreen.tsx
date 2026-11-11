import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Avatar,
  Button,
  Crest,
  ErrorState,
  Screen,
  SectionTitle,
  Skeleton,
  Text,
  useAlerts,
  useTheme,
} from '@/design-system';
import { competitionName } from '@/features/shared/MatchUI';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import type { BolaoMatch } from '@/types/bolao';
import type { Player } from '@/types/player';
import { BOLAO_RULES, maxPoints } from '@/utils/bolaoScoring';
import { formatDayLabel, formatTime } from '@/utils/format';
import { haptic } from '@/utils/haptics';
import { closesIn, ScoreText } from './BolaoParts';

const POSITION_ORDER: Player['position'][] = [
  'Atacante',
  'Meia',
  'Volante',
  'Lateral',
  'Zagueiro',
  'Goleiro',
];

/** Placar de um time: escudo, nome e o número com setas para cima e para baixo. */
function ScorePicker({
  team,
  value,
  onChange,
  disabled,
}: {
  team: BolaoMatch['match']['homeTeam'];
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const btn = (icon: 'chevron-up' | 'chevron-down', next: number, label: string) => (
    <Pressable
      onPress={() => {
        haptic.select();
        onChange(next);
      }}
      disabled={disabled || next < 0 || next > 9}
      accessibilityRole="button"
      accessibilityLabel={`${label} gols do ${team.shortName}`}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 56,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.bgRaised2 : colors.bgRaised,
        opacity: disabled || next < 0 || next > 9 ? 0.35 : 1,
      })}
    >
      <Ionicons name={icon} size={22} color={colors.inkPrimary} />
    </Pressable>
  );
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 12 }}>
      <Crest team={team} size={48} />
      <Text variant="titleM" numberOfLines={1} align="center">
        {team.shortName}
      </Text>
      <View style={{ alignItems: 'center', gap: 8, marginTop: 4 }}>
        {btn('chevron-up', value + 1, 'Mais')}
        <Text
          variant="displayHero"
          accessibilityLabel={`${value} gols`}
          style={{ minWidth: 80, textAlign: 'center' }}
        >
          {value}
        </Text>
        {btn('chevron-down', value - 1, 'Menos')}
      </View>
    </View>
  );
}

/** Escolha de jogador: fileira de rostos com número; toque de novo para desmarcar. */
function PlayerPicker({
  players,
  value,
  onChange,
  disabled,
}: {
  players: Player[];
  value?: string;
  onChange: (id?: string) => void;
  disabled?: boolean;
}) {
  const { colors, layout } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 12 }}
    >
      {players.map((p) => {
        const on = p.id === value;
        return (
          <Pressable
            key={p.id}
            disabled={disabled}
            onPress={() => {
              haptic.select();
              onChange(on ? undefined : p.id);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${p.shortName}, camisa ${p.number}`}
            style={{ width: 80, alignItems: 'center', gap: 8 }}
          >
            <View
              style={{
                borderWidth: 2,
                borderColor: on ? colors.accent : 'transparent',
                borderRadius: 34,
                padding: 2,
              }}
            >
              <Avatar name={p.shortName} number={p.number} size={56} />
              {on && (
                <View
                  style={{
                    position: 'absolute',
                    right: -2,
                    bottom: -2,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: colors.bgCanvas,
                  }}
                >
                  <Ionicons name="checkmark" size={12} color={colors.inkOnRed} />
                </View>
              )}
            </View>
            <Text
              variant="labelM"
              numberOfLines={1}
              adjustsFontSizeToFit
              align="center"
              tone={on ? 'brand' : 'secondary'}
            >
              {p.shortName.split(' ').slice(-1)[0]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function GuessForm({
  item,
  players,
  jokerUsed,
}: {
  item: BolaoMatch;
  players: Player[];
  jokerUsed: boolean;
}) {
  const navigation = useNavigation();
  const { colors, fonts, layout } = useTheme();
  const { showToast, showAlert } = useAlerts();
  const m = item.match;
  const [home, setHome] = useState(item.guess?.home ?? 0);
  const [away, setAway] = useState(item.guess?.away ?? 0);
  const [scorerId, setScorer] = useState(item.guess?.scorerId);
  const [assistId, setAssist] = useState(item.guess?.assistId);
  const [joker, setJoker] = useState(!!item.guess?.joker);
  const [saving, setSaving] = useState(false);
  const locked = item.locked;
  const scorer = players.find((p) => p.id === scorerId);
  const assist = players.find((p) => p.id === assistId);

  const save = async () => {
    setSaving(true);
    try {
      await services.bolao.saveGuess({ matchId: m.id, home, away, scorerId, assistId, joker });
      haptic.success();
      navigation.goBack();
      showAlert({
        id: `guess-${m.id}-${Date.now()}`,
        variant: 'info',
        pose: 'fan-high-five',
        title: item.guess ? 'Palpite atualizado!' : 'Palpite feito!',
        message: [
          `${m.homeTeam.shortName} ${home} × ${away} ${m.awayTeam.shortName}`,
          scorer ? `gol de ${scorer.shortName}` : undefined,
          joker ? 'com coringa' : undefined,
        ]
          .filter(Boolean)
          .join(', ')
          .concat(`. Vale até ${maxPoints(joker)} pontos.`),
        primary: { label: 'Fechar' },
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Não deu para salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <Screen title="Seu palpite">
        <View style={{ alignItems: 'center', gap: 4, paddingHorizontal: layout.gutter }}>
          <Text variant="titleS">
            {competitionName(m.competitionId)} · {m.stage}
          </Text>
          <Text variant="bodyM" tone="secondary">
            {formatDayLabel(m.kickoff)}, {formatTime(m.kickoff)} · {m.venue.name}
          </Text>
          <Text variant="labelM" tone={locked ? 'tertiary' : 'brand'} style={{ marginTop: 4 }}>
            {locked ? 'Palpites fechados: a bola já rolou' : closesIn(m.kickoff)}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingHorizontal: layout.gutter,
            marginTop: 32,
          }}
        >
          <ScorePicker team={m.homeTeam} value={home} onChange={setHome} disabled={locked} />
          <Text
            variant="titleL"
            tone="tertiary"
            style={{ marginTop: 172, fontFamily: fonts.regular, fontSize: 28 }}
          >
            ×
          </Text>
          <ScorePicker team={m.awayTeam} value={away} onChange={setAway} disabled={locked} />
        </View>

        <View style={{ marginTop: 48 }}>
          <SectionTitle
            title="Quem marca pelo Flamengo?"
            subtitle={
              scorer
                ? `${scorer.shortName} · +${BOLAO_RULES.scorer} pts se marcar`
                : `+${BOLAO_RULES.scorer} pts se o seu escolhido marcar`
            }
          />
          <PlayerPicker players={players} value={scorerId} onChange={setScorer} disabled={locked} />
        </View>

        <View style={{ marginTop: 40 }}>
          <SectionTitle
            title="Quem dá a assistência?"
            subtitle={
              assist
                ? `${assist.shortName} · +${BOLAO_RULES.assist} pts se der o passe`
                : `+${BOLAO_RULES.assist} pts se o seu escolhido der o passe`
            }
          />
          <PlayerPicker players={players} value={assistId} onChange={setAssist} disabled={locked} />
        </View>

        <View
          style={{
            marginTop: 40,
            marginHorizontal: layout.gutter,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.lineHairline,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="titleM">Coringa</Text>
            <Text variant="bodyS" tone="secondary">
              {jokerUsed && !joker
                ? 'Você já usou o coringa deste mês em outro jogo.'
                : 'Dobra os pontos deste jogo. Um por mês.'}
            </Text>
          </View>
          <Switch
            value={joker}
            onValueChange={(v) => {
              haptic.select();
              setJoker(v);
            }}
            disabled={locked || (jokerUsed && !joker)}
            accessibilityLabel="Usar coringa"
            trackColor={{ true: colors.accent, false: colors.bgRaised2 }}
            thumbColor={colors.inkOnRed}
            ios_backgroundColor={colors.bgRaised2}
          />
        </View>
        <View style={{ height: 140 }} />
      </Screen>

      {!locked && (
        <SafeAreaView
          edges={['bottom']}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.bgCanvas,
            borderTopWidth: 1,
            borderColor: colors.lineHairline,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: layout.gutter, gap: 16 }}>
            <View style={{ flex: 1 }}>
              <ScoreText home={home} away={away} variant="displayM" />
              <Text variant="bodyS" tone="secondary">
                Vale até {maxPoints(joker)} pts
              </Text>
            </View>
            <Button label={item.guess ? 'Atualizar' : 'Salvar palpite'} onPress={save} loading={saving} />
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

/** Palpite de um jogo: placar, artilheiro, garçom e coringa. */
export function BolaoGuessScreen({ route }: RootScreenProps<'BolaoGuess'>) {
  const { layout } = useTheme();
  const { matchId } = route.params;
  const q = useAsync(async () => {
    const [item, squad, jokerUsed] = await Promise.all([
      services.bolao.getMatch(matchId),
      services.matches.getSquad(),
      services.bolao.jokerUsedElsewhere(matchId),
    ]);
    const players = squad
      .filter((p) => p.position !== 'Goleiro')
      .sort((a, b) => POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position));
    return { item, players, jokerUsed };
  }, [matchId]);

  if (q.loading)
    return (
      <Screen title="Seu palpite">
        <View style={{ padding: layout.gutter, gap: 16 }}>
          <Skeleton height={260} radius={8} />
          <Skeleton height={100} radius={8} />
        </View>
      </Screen>
    );
  if (q.error || !q.data)
    return (
      <Screen title="Seu palpite" scroll={false}>
        <ErrorState onRetry={q.reload} />
      </Screen>
    );
  return <GuessForm item={q.data.item} players={q.data.players} jokerUsed={q.data.jokerUsed} />;
}
