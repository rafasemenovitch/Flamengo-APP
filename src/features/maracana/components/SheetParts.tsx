import { Ionicons } from '@expo/vector-icons';
import { forwardRef, type ReactNode } from 'react';
import { Pressable, ScrollView, TextInput, View, type TextInputInstance } from 'react-native';

import { Text, useTheme } from '@/design-system';
import type { PoiCategory } from '@/services/stadium/types';
import { CATEGORY_COLOR, GROUPS } from '../categories';
import { Pictogram } from './Pictogram';

/** Distância curta para leitura rápida: "40 m", "120 m". */
export const meters = (d: number) => `${Math.max(10, Math.round(d / 10) * 10)} m`;

/** Rótulo + valor, como os campos do ingresso (SETOR, PORTÃO). */
export function Field({
  label,
  value,
  grow,
  lines = 1,
}: {
  label: string;
  value: string;
  grow?: boolean;
  lines?: number;
}) {
  return (
    <View style={{ gap: 2, flex: grow ? 1 : undefined, minWidth: 56 }}>
      <Text variant="overline" tone="tertiary">
        {label}
      </Text>
      <Text variant="titleL" numberOfLines={lines}>
        {value}
      </Text>
    </View>
  );
}

/** Título de seção dentro da folha. */
export function SheetLabel({ children, right }: { children: string; right?: ReactNode }) {
  const { layout } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: layout.gutter,
        marginTop: 28,
        marginBottom: 4,
      }}
    >
      <Text variant="overline" tone="secondary" accessibilityRole="header">
        {children}
      </Text>
      {right}
    </View>
  );
}

/**
 * "Você está em": a área do torcedor, com o nível à direita. Toca para trocar.
 * Sem área escolhida, vira o convite "Onde você está?".
 */
export function WhereAmI({
  area,
  level,
  ticketLine,
  onPress,
}: {
  area?: string;
  level?: string;
  ticketLine?: string;
  onPress: () => void;
}) {
  const { colors, layout } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={area ? `Você está em ${area}. Trocar` : 'Onde você está? Escolher setor'}
      style={({ pressed }) => ({
        paddingHorizontal: layout.gutter,
        paddingBottom: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="overline" tone="tertiary">
            {area ? 'Você está em' : 'Onde você está?'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              variant="displayM"
              tone={area ? 'primary' : 'secondary'}
              numberOfLines={1}
              style={{ flexShrink: 1 }}
            >
              {area ?? 'Escolha seu setor'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.inkSecondary} />
          </View>
        </View>
        {level && (
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text variant="overline" tone="tertiary">
              Nível
            </Text>
            <Text variant="displayM">{level}</Text>
          </View>
        )}
      </View>
      {ticketLine && (
        <Text variant="bodyS" tone="secondary" style={{ marginTop: 4 }}>
          {ticketLine}
        </Text>
      )}
    </Pressable>
  );
}

export const SearchField = forwardRef<
  TextInputInstance,
  { value: string; onChange: (v: string) => void; onFocus: () => void; onClear: () => void }
>(function SearchField({ value, onChange, onFocus, onClear }, ref) {
  const { colors, layout, radius, typography } = useTheme();
  return (
    <View style={{ paddingHorizontal: layout.gutter }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 46,
          borderRadius: radius.m,
          backgroundColor: colors.bgRaised2,
          paddingLeft: 14,
          gap: 8,
        }}
      >
        <Ionicons name="search" size={18} color={colors.inkSecondary} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          placeholder="Banheiro, comida, portão…"
          placeholderTextColor={colors.inkTertiary}
          selectionColor={colors.accentText}
          returnKeyType="search"
          maxFontSizeMultiplier={1.3}
          autoCorrect={false}
          accessibilityLabel="Buscar no estádio"
          style={[typography.bodyM, { flex: 1, height: 46, color: colors.inkPrimary }]}
        />
        {!!value && (
          <Pressable
            onPress={onClear}
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

/** Atalhos no padrão da Home: ícone + rótulo, separados por fios verticais; o ativo fica vermelho. */
export function Shortcuts({
  active,
  onChange,
}: {
  active: string | null;
  onChange: (key: string | null) => void;
}) {
  const { colors, layout } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: layout.gutter - 6, paddingTop: 16 }}
    >
      {GROUPS.map((g, i) => {
        const on = active === g.key;
        const tint = on ? colors.accentText : colors.inkPrimary;
        return (
          <Pressable
            key={g.key}
            onPress={() => onChange(on ? null : g.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`Mostrar ${g.label.toLowerCase()}`}
            style={({ pressed }) => ({
              width: 76,
              alignItems: 'center',
              gap: 6,
              paddingVertical: 6,
              borderLeftWidth: i === 0 ? 0 : 1,
              borderColor: colors.lineHairline,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Pictogram category={g.icon} size={26} color={tint} />
            <Text variant="labelM" style={{ color: on ? colors.accentText : colors.inkSecondary }}>
              {g.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Ícone da categoria na cor do mapa, para a lista e o mapa falarem a mesma língua. */
export function CategoryMark({ category, size = 32 }: { category: PoiCategory; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: CATEGORY_COLOR[category],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Pictogram category={category} size={size * 0.62} color="#FFFFFF" />
    </View>
  );
}

/** Linha de lugar: ícone, nome, onde fica e a distância. */
export function PlaceRow({
  category,
  title,
  meta,
  right,
  onPress,
}: {
  category?: PoiCategory;
  title: string;
  meta?: string;
  right?: string;
  onPress: () => void;
}) {
  const { colors, layout } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, meta, right].filter(Boolean).join(', ')}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 60,
        paddingHorizontal: layout.gutter,
        borderBottomWidth: 1,
        borderColor: colors.lineHairline,
        backgroundColor: pressed ? colors.bgRaised2 : 'transparent',
      })}
    >
      {category && <CategoryMark category={category} />}
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="titleS" numberOfLines={1}>
          {title}
        </Text>
        {meta && (
          <Text variant="bodyS" tone="secondary" numberOfLines={1}>
            {meta}
          </Text>
        )}
      </View>
      {right && <Text variant="numericTable">{right}</Text>}
    </Pressable>
  );
}
