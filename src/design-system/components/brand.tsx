import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { brandAssets } from '@assets/brand';
import { photos, placeholders, type PhotoAspect } from '@assets/photos';
import { CLUB } from '@/data/demo/seed';
import { fonts } from '../tokens/typography';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

const SHIELD_PATH = 'M50 4 L92 16 V52 C92 76 72 92 50 100 C28 92 8 76 8 52 V16 Z';

export interface CrestTeam {
  id: string;
  code: string;
  color: string;
  shortName?: string;
}

/**
 * Escudo ÚNICO do app (especificação 9.3): forma de escudo + sigla de 3 letras
 * na cor de placeholder do time. O do Flamengo vira o escudo oficial
 * automaticamente quando `brandAssets.crest` for preenchido.
 * Tamanhos: 20 (lista) · 28 (ingresso) · 40 (palpite) · 56 (hero).
 */
export function Crest({ team, size = 40 }: { team: CrestTeam; size?: number }) {
  const { colors } = useTheme();
  const label = `Escudo ${team.shortName ?? team.code}`;
  if (team.id === CLUB.id && brandAssets.crest) {
    return (
      <Image
        source={brandAssets.crest}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel={label}
      />
    );
  }
  return (
    <View accessible accessibilityLabel={`${label} (placeholder)`} style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 104">
        <Path
          d={SHIELD_PATH}
          fill={team.color}
          stroke={colors.inkPrimary}
          strokeOpacity={0.85}
          strokeWidth={4}
        />
        <SvgText
          x="50"
          y="63"
          fontSize="29"
          fontFamily={fonts.displayNormal700}
          fontWeight="700"
          fill={colors.inkOnRed}
          textAnchor="middle"
        >
          {team.code.slice(0, 3).toUpperCase()}
        </SvgText>
      </Svg>
    </View>
  );
}

/** Escudo do Flamengo (atalho para <Crest team={CLUB} />). */
export function ClubCrest({ size = 40 }: { size?: number }) {
  return <Crest team={CLUB} size={size} />;
}

/** @deprecated use <Crest team={...} />. */
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
    <Crest team={{ id: shortName === 'FLA' ? CLUB.id : shortName, code: shortName, color }} size={size} />
  );
}

function hashKey(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

export interface TreatedImageProps {
  /** Chave de conteúdo (ex.: 'news-1'); escolhe a foto registrada ou um placeholder estável. */
  imageKey: string;
  aspect?: PhotoAspect;
  /** Degradê de leitura da parte de baixo da foto. */
  overlay?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * Foto com o tratamento "bandeirão" (duotone vermelho/preto, grão), aplicado
 * no arquivo por scripts/treat-images.py.
 */
export function TreatedImage({ imageKey, aspect = 'wide', overlay, style, children }: TreatedImageProps) {
  const { colors } = useTheme();
  const list = placeholders[aspect];
  const source = photos[imageKey] ?? list[hashKey(imageKey) % list.length]!;
  return (
    <View style={[styles.media, { backgroundColor: colors.bgRed }, style]}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill as StyleProp<ImageStyle>}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      {overlay && (
        <LinearGradient
          colors={colors.overlayPhoto}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );
}

/** @deprecated use TreatedImage. Mantido para telas ainda não migradas. */
export function MediaImage({
  imageKey,
  style,
  scrim,
  children,
}: {
  imageKey: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  scrim?: boolean;
  children?: ReactNode;
}) {
  const aspect: PhotoAspect = imageKey.startsWith('video')
    ? 'video'
    : imageKey.startsWith('product') || imageKey.startsWith('player')
      ? 'square'
      : 'wide';
  return (
    <TreatedImage imageKey={imageKey} aspect={aspect} overlay={scrim} style={style}>
      {children}
    </TreatedImage>
  );
}

/** Avatar circular com iniciais ou número (placeholder de foto). */
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
        backgroundColor: colors.bgRaised2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        variant="labelM"
        style={{ fontSize: size * 0.36, lineHeight: size * 0.44, color: colors.inkPrimary }}
      >
        {number !== undefined ? number : initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  media: { overflow: 'hidden' },
});
