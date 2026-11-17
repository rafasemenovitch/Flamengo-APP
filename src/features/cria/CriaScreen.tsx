import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ScrollViewInstance,
  type TextInputInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, Text, useTheme } from '@/design-system';
import { CRIA_PLAYERS } from '@/data/cria/players';
import { CRIA_SCHEDULE } from '@/data/cria/schedule.generated';
import type { CriaPlayer } from '@/data/cria/types';
import type { RootStackParamList } from '@/navigation/types';
import { haptic } from '@/utils/haptics';

import { GuessGrid, MAX_GUESSES, REVEAL_TOTAL_MS, type GuessView } from './Clues';
import { compare, isWin, toAttributes } from './compare';
import { challengeNumber, dayKey, shortDate } from './dates';
import { PlayerSearch } from './PlayerSearch';
import { ResultBlock } from './ResultBlock';
import { RulesSheet } from './RulesSheet';
import { secretIdFor } from './schedule';
import { periodLabel } from './search';

const RULES_SEEN_KEY = '@flamengo/cria-regras-vistas';
const byId = new Map(CRIA_PLAYERS.map((p) => [p.id, p]));

function toView(guess: CriaPlayer, secret: CriaPlayer): GuessView {
  return {
    playerId: guess.id,
    name: guess.name,
    period: periodLabel(guess),
    clues: compare(toAttributes(guess), toAttributes(secret)),
  };
}

/** Quem é o Cria?: descubra o jogador rubro-negro do dia em até 5 tentativas. */
export function CriaScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Cria'>>();
  const { colors, layout, radius } = useTheme();
  const [today] = useState(() => dayKey());

  // Prévia (prints): secreto e palpites pela rota; senão, o desafio do dia.
  const secret = byId.get(params?.secreto ?? secretIdFor(CRIA_SCHEDULE, today) ?? '') ?? CRIA_PLAYERS[0]!;
  const [guessIds, setGuessIds] = useState<string[]>(() =>
    (params?.palpites ?? '').split(',').filter((id) => byId.has(id))
  );
  const [justGuessed, setJustGuessed] = useState(false);
  const guesses = useMemo(() => guessIds.map((id) => toView(byId.get(id)!, secret)), [guessIds, secret]);
  const won = guesses.some((g) => isWin(g.clues));
  const over = won || guesses.length >= MAX_GUESSES;
  // O fim só aparece depois que a última linha terminou de virar.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!over || !justGuessed) return;
    const t = setTimeout(() => {
      setRevealed(true);
      if (won) haptic.success();
    }, REVEAL_TOTAL_MS);
    return () => clearTimeout(t);
  }, [over, won, justGuessed]);
  const showResult = over && (!justGuessed || revealed);

  const [query, setQuery] = useState('');
  const input = useRef<TextInputInstance>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  // Partida já terminada ao abrir: vai direto ao resultado.
  useEffect(() => {
    if (!over || justGuessed) return;
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: false }), 250);
    return () => clearTimeout(t);
    // só na abertura
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const used = useMemo(() => new Set(guessIds), [guessIds]);

  // Regras abrem sozinhas uma única vez.
  const [rules, setRules] = useState(false);
  useEffect(() => {
    if (params?.palpites) return;
    AsyncStorage.getItem(RULES_SEEN_KEY)
      .then((v) => {
        if (!v) setRules(true);
      })
      .catch(() => undefined);
  }, [params?.palpites]);
  const closeRules = () => {
    setRules(false);
    AsyncStorage.setItem(RULES_SEEN_KEY, '1').catch(() => undefined);
  };

  const pick = (p: CriaPlayer) => {
    if (used.has(p.id) || over) return;
    haptic.select();
    setJustGuessed(true);
    setGuessIds((g) => [...g, p.id]);
    setQuery('');
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  };

  const secretView: GuessView = {
    playerId: secret.id,
    name: secret.name,
    period: periodLabel(secret),
    clues: compare(toAttributes(secret), toAttributes(secret)),
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, minHeight: 52 }}
      >
        <IconButton
          icon="chevron-back"
          variant="plain"
          accessibilityLabel="Voltar"
          onPress={() => navigation.goBack()}
        />
        <IconButton
          icon="help-circle-outline"
          variant="plain"
          accessibilityLabel="Como jogar"
          onPress={() => setRules(true)}
        />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: layout.gutter, paddingBottom: 24, gap: 24 }}
        >
          <View style={{ gap: 6 }}>
            <Text variant="bodyS" tone="secondary">
              #{challengeNumber(today)} · {shortDate(today)}
            </Text>
            <Text variant="displayL" accessibilityRole="header">
              Quem é o Cria?
            </Text>
            {guesses.length === 0 && (
              <Text variant="bodyM" tone="secondary">
                Descubra o jogador rubro-negro em até 5 tentativas.
              </Text>
            )}
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}
              accessible
              accessibilityLabel={`${guesses.length} de ${MAX_GUESSES} tentativas usadas`}
            >
              <View style={{ flexDirection: 'row', gap: 4, flex: 1 }}>
                {Array.from({ length: MAX_GUESSES }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: radius.full,
                      backgroundColor:
                        i < guesses.length
                          ? won && i === guesses.length - 1
                            ? colors.success
                            : colors.inkPrimary
                          : colors.bgRaised2,
                    }}
                  />
                ))}
              </View>
              <Text variant="labelM" tone="secondary">
                {guesses.length} de {MAX_GUESSES}
              </Text>
            </View>
          </View>

          <GuessGrid guesses={guesses} animateLast={justGuessed} showEmpty={!over} />

          {showResult && <ResultBlock won={won} guesses={guesses.length} secret={secretView} />}
        </ScrollView>

        {!over && (
          <View style={{ paddingHorizontal: layout.gutter, paddingTop: 8, paddingBottom: 12 }}>
            <PlayerSearch
              ref={input}
              query={query}
              onQuery={setQuery}
              used={used}
              onPick={pick}
              placeholder={guesses.length ? 'Próximo palpite' : 'Digite o nome de um jogador'}
            />
          </View>
        )}
      </KeyboardAvoidingView>

      <RulesSheet visible={rules} onClose={closeRules} />
    </SafeAreaView>
  );
}
