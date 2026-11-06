import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { ClipPath, Defs, Path, Rect, Text as SvgText } from 'react-native-svg';

import { brandAssets, mediaAssets } from '@assets/brand';
import { palette } from '../tokens/colors';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

const SHIELD_PATH = 'M50 4 L92 16 V52 C92 76 72 92 50 100 C28 92 8 76 8 52 V16 Z';

/**
 * Escudo do clube. Sem licença ainda: desenha um escudo GENÉRICO (não imita o
 * oficial). Troca automaticamente quando `brandAssets.crest` for preenchido.
 */
export function ClubCrest({ size = 40 }: { size?: number }) {
  const { colors } = useTheme();
  if (brandAssets.crest) {
    return (
      <Image
        source={brandAssets.crest}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="Escudo do clube"
      />
    );
  }
  return (
    <View accessible accessibilityLabel="Escudo do clube (placeholder)" style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 104">
        <Defs>
          <ClipPath id="shield">
            <Path d={SHIELD_PATH} />
          </ClipPath>
        </Defs>
        <Rect x="0" y="0" width="100" height="104" fill={colors.primary} clipPath="url(#shield)" />
        <Rect x="0" y="52" width="100" height="52" fill={palette.ink900} clipPath="url(#shield)" />
        <Path d={SHIELD_PATH} fill="none" stroke={palette.white} strokeWidth={4} />
      </Svg>
    </View>
  );
}

/** Escudo genérico de adversário: forma neutra + sigla + cor principal do seed. */
export function TeamCrest({
  shortName,
  color,
  size = 40,
}: {
  shortName: string;
  color: string;
  size?: number;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`Escudo de ${shortName} (placeholder)`}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 104">
        <Path d={SHIELD_PATH} fill={color} stroke="rgba(255,255,255,0.7)" strokeWidth={4} />
        <SvgText x="50" y="62" fontSize="30" fontWeight="800" fill={palette.white} textAnchor="middle">
          {shortName.slice(0, 3).toUpperCase()}
        </SvgText>
      </Svg>
    </View>
  );
}

const MEDIA_GRADIENTS: readonly (readonly [string, string])[] = [
  [palette.red800, palette.ink900],
  [palette.red600, palette.red900],
  [palette.ink700, palette.ink950],
  [palette.red900, palette.red700],
  [palette.ink800, palette.red800],
];

function hashKey(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

export interface MediaImageProps {
  /** Chave da imagem (ver mediaAssets). Sem imagem registrada, mostra placeholder. */
  imageKey: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  /** Escurece a parte de baixo para texto por cima. */
  scrim?: boolean;
  children?: ReactNode;
}

/** Imagem de notícia/vídeo/produto. Placeholder: degradê rubro-negro estável por chave + ícone. */
export function MediaImage({ imageKey, icon = 'image-outline', style, scrim, children }: MediaImageProps) {
  const { colors } = useTheme();
  const source = mediaAssets[imageKey];
  const gradient = MEDIA_GRADIENTS[hashKey(imageKey) % MEDIA_GRADIENTS.length]!;

  return (
    <View style={[styles.media, style]}>
      {source ? (
        <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.center]}
        >
          <Ionicons name={icon} size={32} color="rgba(255,255,255,0.28)" />
        </LinearGradient>
      )}
      {scrim && <LinearGradient colors={colors.mediaScrim} style={StyleSheet.absoluteFill} />}
      {children}
    </View>
  );
}

/** Avatar com iniciais (placeholder de foto de torcedor/jogador). */
export function Avatar({ name, size = 40, number }: { name: string; size?: number; number?: number }) {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View
      accessible
      accessibilityLabel={name}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primarySubtle,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="label" tone="brand" style={{ fontSize: size * 0.36, lineHeight: size * 0.44 }}>
        {number !== undefined ? number : initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  media: { overflow: 'hidden', backgroundColor: palette.ink900 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
