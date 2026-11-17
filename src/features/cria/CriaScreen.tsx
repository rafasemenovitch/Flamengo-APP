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
import type { CriaPlayer } from '@/data/cria/types';
import type { RootStackParamList } from '@/navigation/types';
import { haptic } from '@/utils/haptics';

import { GuessGrid, MAX_GUESSES, REVEAL_TOTAL_MS } from './Clues';
import { shortDate } from './dates';
import { PlayerSearch } from './PlayerSearch';
import { ResultBlock } from './ResultBlock';
import { RulesSheet } from './RulesSheet';
import { useCriaGame } from './useCriaGame';
import { useHighContrast } from './contrast';

const RULES_SEEN_KEY = '@flamengo/cria-regras-vistas';

/** Quem é o Cria?: descubra o jogador rubro-negro do dia em até 5 tentativas. */
export function CriaScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Cria'>>();
  const { colors, layout, radius } = useTheme();
  const { game, guess, newDay, openNewDay } = useCriaGame(params);
  const contrast = useHighContrast();
  const guesses = useMemo(() => game?.rows ?? [], [game]);
  const won = game?.status === 'venceu';
  const over = !!game && game.status !== 'jogando';

  // Linha recém-chutada: vira com animação, e o fim só aparece depois dela.
  const [justGuessed, setJustGuessed] = useState(false);
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
  const landed = useRef(false);
  useEffect(() => {
    if (!game || landed.current) return;
    landed.current = true;
    if (game.status === 'jogando') return;
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: false }), 250);
    return () => clearTimeout(t);
  }, [game]);
  const used = useMemo(() => new Set(guesses.map((g) => g.playerId)), [guesses]);

  // Regras abrem sozinhas uma única vez.
  const [rules, setRules] = useState(false);
  useEffect(() => {
    if (params?.secreto) return;
    AsyncStorage.getItem(RULES_SEEN_KEY)
      .then((v) => {
        if (!v) setRules(true);
      })
      .catch(() => undefined);
  }, [params?.secreto]);
  const closeRules = () => {
    setRules(false);
    AsyncStorage.setItem(RULES_SEEN_KEY, '1').catch(() => undefined);
  };

  const pick = (p: CriaPlayer) => {
    if (!game || used.has(p.id) || over) return;
    haptic.select();
    setJustGuessed(true);
    setRevealed(false);
    setQuery('');
    void guess(p.id).then(() => setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50));
  };

  const playNewDay = () => {
    setJustGuessed(false);
    landed.current = false;
    void openNewDay();
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
              {game ? `#${game.number} · ${shortDate(game.date)}` : ' '}
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
                            ? contrast
                              ? colors.contrastExact
                              : colors.success
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

          {showResult && game && <ResultBlock game={game} newDay={newDay} onPlayNewDay={playNewDay} />}
        </ScrollView>

        {game && !over && (
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
