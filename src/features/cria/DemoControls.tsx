import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Button, Text, useTheme } from '@/design-system';
import { CRIA_PLAYERS } from '@/data/cria/players';
import { services } from '@/services';
import { haptic } from '@/utils/haptics';

import { periodLabel, searchPlayers } from './search';

/**
 * Controles escondidos do Quem é o Cria? (só na demonstração, dentro do painel aberto com
 * toque longo no topo da Home): avançar o dia, reiniciar o de hoje e escolher o secreto.
 */
export function CriaDemoControls() {
  const { colors, radius, typography } = useTheme();
  const [msg, setMsg] = useState('');
  const [query, setQuery] = useState('');
  const hits = useMemo(() => searchPlayers(CRIA_PLAYERS, query, new Set(), 4), [query]);

  const run = async (fn: () => Promise<void>, done: string) => {
    haptic.select();
    await fn();
    setMsg(done);
  };

  return (
    <View style={{ marginTop: 12, gap: 8 }}>
      <Text variant="titleL">Quem é o Cria?</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button
          label="Próximo dia"
          variant="secondary"
          size="sm"
          style={{ flex: 1 }}
          onPress={() => run(services.dailyGame.demo.nextDay, 'Avançou um dia.')}
        />
        <Button
          label="Dia de hoje"
          variant="secondary"
          size="sm"
          style={{ flex: 1 }}
          onPress={() => run(services.dailyGame.demo.realDay, 'Voltou ao dia de verdade.')}
        />
      </View>
      <Button
        label="Reiniciar o desafio de hoje"
        variant="secondary"
        size="sm"
        onPress={() => run(services.dailyGame.demo.resetToday, 'Desafio de hoje zerado.')}
      />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Escolher o Cria de hoje"
        placeholderTextColor={colors.inkTertiary}
        autoCorrect={false}
        accessibilityLabel="Escolher o Cria de hoje"
        style={[
          typography.bodyM,
          {
            height: 44,
            borderRadius: radius.m,
            backgroundColor: colors.bgRaised2,
            paddingHorizontal: 14,
            color: colors.inkPrimary,
          },
        ]}
      />
      {hits.map((h) => (
        <Pressable
          key={h.player.id}
          accessibilityRole="button"
          onPress={() =>
            run(
              () => services.dailyGame.demo.setSecret(h.player.id),
              `${h.player.name} é o Cria de hoje.`
            ).then(() => setQuery(''))
          }
          style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
        >
          <Text variant="titleS">
            {h.player.name}{' '}
            <Text variant="bodyS" tone="tertiary">
              {periodLabel(h.player)}
            </Text>
          </Text>
        </Pressable>
      ))}
      {!!msg && (
        <Text variant="bodyS" tone="secondary">
          {msg}
        </Text>
      )}
    </View>
  );
}
