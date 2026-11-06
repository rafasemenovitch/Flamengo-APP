import { Image, View, type ImageSourcePropType } from 'react-native';

import { Text } from './components/Text';
import { useTheme } from './theme/ThemeProvider';

/**
 * Mascote (urubu). Regra: chat e FAB usam só `assistant-*` (com headset);
 * estados vazios, erros, comemorações e notificações usam só `fan-*`.
 * Para ativar uma pose: coloque o PNG em assets/mascot/<grupo>/ e troque o
 * `null` correspondente por `require('../../assets/mascot/<grupo>/<pose>.png')`.
 */
export const MASCOT_POSES = {
  'assistant-neutral': null,
  'assistant-wave': null,
  'assistant-talking': null,
  'assistant-thinking': null,
  'assistant-confused': null,
  'assistant-sorry': null,
  'assistant-wink': null,
  'assistant-happy': null,
  'assistant-thumbs-up': null,
  'assistant-point-right': null,
  'assistant-point-up': null,
  'assistant-phone': null,
  'assistant-magnifier': null,
  'assistant-clipboard': null,
  'assistant-map': null,
  'assistant-how-can-i-help': null,
  'fan-goal': null,
  'fan-tense': null,
  'fan-almost': null,
  'fan-complain': null,
  'fan-scarf': null,
  'fan-victory': null,
  'fan-draw': null,
  'fan-defeat': null,
  'fan-ticket': null,
  'fan-watch': null,
  'fan-point-gate': null,
  'fan-snacks': null,
  'fan-backpack': null,
  'fan-arrived': null,
  'fan-shopping-bag': null,
  'fan-jersey': null,
  'fan-member-card': null,
  'fan-gift': null,
  'fan-vip': null,
  'fan-delivery': null,
  'fan-trophy': null,
  'fan-medal': null,
  'fan-quiz': null,
  'fan-passport': null,
  'fan-vote': null,
  'fan-level-up': null,
  'fan-high-five': null,
  'fan-community': null,
  'fan-confident': null,
  'fan-celebrate': null,
  'fan-keepy-uppy': null,
  'fan-flag': null,
  'fan-running': null,
  'fan-welcome': null,
  'fan-empty': null,
  'fan-no-matches': null,
  'fan-offline': null,
  'fan-notifications': null,
  'fan-maintenance': null,
  'fan-empty-cart': null,
} satisfies Record<string, ImageSourcePropType | null>;

export type MascotPose = keyof typeof MASCOT_POSES;

export function hasMascot(pose: MascotPose) {
  return MASCOT_POSES[pose] !== null;
}

/**
 * Sem a imagem: em desenvolvimento mostra uma silhueta com o nome da pose;
 * em produção não renderiza nada (o layout não quebra).
 */
export function Mascot({ pose, size = 160 }: { pose: MascotPose; size?: number }) {
  const { colors } = useTheme();
  const source = MASCOT_POSES[pose] as ImageSourcePropType | null;
  if (source) {
    return (
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    );
  }
  if (!__DEV__) return null;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.bgRaised2,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
      }}
    >
      <Text
        variant="bodyS"
        tone="tertiary"
        align="center"
        numberOfLines={2}
        style={{ fontSize: Math.max(9, Math.min(13, size / 9)) }}
      >
        {pose}
      </Text>
    </View>
  );
}
