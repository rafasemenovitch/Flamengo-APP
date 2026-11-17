import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useMemo } from 'react';
import { Pressable, TextInput, View, type TextInputInstance } from 'react-native';

import { Text, useTheme } from '@/design-system';
import { CRIA_PLAYERS } from '@/data/cria/players';
import type { CriaPlayer } from '@/data/cria/types';

import { periodLabel, searchPlayers } from './search';

/** Iniciais no lugar da foto (sem imagem licenciada por enquanto): "Léo Moura" → "LM". */
export function InitialsBadge({ name, size = 36 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  const letters = name
    .split(' ')
    .filter((w) => /^[A-ZÀ-Ý]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.bgRaised2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="labelM">{letters}</Text>
    </View>
  );
}

/** Campo de palpite com sugestões acima (ele fica preso no pé da tela, sobre o teclado). */
export const PlayerSearch = forwardRef<
  TextInputInstance,
  {
    query: string;
    onQuery: (q: string) => void;
    used: ReadonlySet<string>;
    onPick: (p: CriaPlayer) => void;
    placeholder: string;
  }
>(function PlayerSearch({ query, onQuery, used, onPick, placeholder }, ref) {
  const { colors, radius, typography } = useTheme();
  const hits = useMemo(() => searchPlayers(CRIA_PLAYERS, query, used, 6), [query, used]);
  return (
    <View style={{ gap: 8 }}>
      {hits.length > 0 && (
        <View style={{ backgroundColor: colors.bgRaised, borderRadius: radius.l, overflow: 'hidden' }}>
          {hits.map((h, i) => (
            <Pressable
              key={h.player.id}
              onPress={() => onPick(h.player)}
              disabled={h.used}
              accessibilityRole="button"
              accessibilityState={{ disabled: h.used }}
              accessibilityLabel={`${h.player.name}, ${periodLabel(h.player)}${h.used ? ', já chutado' : ''}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 16,
                minHeight: 56,
                borderTopWidth: i ? 1 : 0,
                borderColor: colors.lineHairline,
                opacity: h.used ? 0.4 : pressed ? 0.7 : 1,
              })}
            >
              <InitialsBadge name={h.player.name} />
              <View style={{ flex: 1 }}>
                <Text variant="titleS" numberOfLines={1}>
                  {h.player.name}
                </Text>
                <Text variant="bodyS" tone="tertiary" numberOfLines={1}>
                  {h.used
                    ? 'Já chutado'
                    : `${periodLabel(h.player)}${h.matchedAlias ? ` · ${h.matchedAlias}` : ''}`}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      {!!query.trim() && hits.length === 0 && (
        <Text variant="bodyS" tone="secondary" style={{ paddingHorizontal: 4 }}>
          Ninguém com esse nome na base.
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 52,
          borderRadius: radius.m,
          backgroundColor: colors.bgRaised2,
          borderWidth: 1,
          borderColor: query ? colors.lineStrong : colors.bgRaised2,
          paddingLeft: 16,
          gap: 10,
        }}
      >
        <Ionicons name="search" size={18} color={colors.inkSecondary} />
        <TextInput
          ref={ref}
          value={query}
          onChangeText={onQuery}
          placeholder={placeholder}
          placeholderTextColor={colors.inkTertiary}
          selectionColor={colors.accentText}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
          maxFontSizeMultiplier={1.3}
          accessibilityLabel="Buscar jogador"
          style={[typography.bodyL, { flex: 1, height: 52, color: colors.inkPrimary }]}
        />
        {!!query && (
          <Pressable
            onPress={() => onQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close-circle" size={18} color={colors.inkTertiary} />
          </Pressable>
        )}
      </View>
    </View>
  );
});
