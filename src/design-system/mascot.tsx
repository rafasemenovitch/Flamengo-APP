import { Image, type ImageSourcePropType } from 'react-native';

/**
 * Mascote (urubu torcedor, SEM headset). O urubu com headset é o Assistente
 * Fla e mora só no chat (src/features/assistant/poses.ts).
 *
 * Para não deixar o app infantil, ele aparece só em momentos interativos:
 * pop-ups (entrada no app, lances do jogo, palpite salvo, prêmio resgatado)
 * e na Nação (bolão, trilha, comunidade, quiz). Imagens geradas por
 * scripts/import-mascot.py a partir de urubu_assets_completo/mascote.
 */
export const MASCOT_POSES = {
  'fan-flag': require('../../assets/mascot/fan/fan-flag.png'),
  'fan-welcome': require('../../assets/mascot/fan/fan-welcome.png'),
  'fan-goal': require('../../assets/mascot/fan/fan-goal.png'),
  'fan-almost': require('../../assets/mascot/fan/fan-almost.png'),
  'fan-scarf': require('../../assets/mascot/fan/fan-scarf.png'),
  'fan-victory': require('../../assets/mascot/fan/fan-victory.png'),
  'fan-draw': require('../../assets/mascot/fan/fan-draw.png'),
  'fan-defeat': require('../../assets/mascot/fan/fan-defeat.png'),
  'fan-trophy': require('../../assets/mascot/fan/fan-trophy.png'),
  'fan-quiz': require('../../assets/mascot/fan/fan-quiz.png'),
  'fan-level-up': require('../../assets/mascot/fan/fan-level-up.png'),
  'fan-high-five': require('../../assets/mascot/fan/fan-high-five.png'),
  'fan-community': require('../../assets/mascot/fan/fan-community.png'),
  'fan-gift': require('../../assets/mascot/fan/fan-gift.png'),
} satisfies Record<string, ImageSourcePropType>;

export type MascotPose = keyof typeof MASCOT_POSES;

export function Mascot({ pose, size = 160 }: { pose: MascotPose; size?: number }) {
  return (
    <Image
      source={MASCOT_POSES[pose]}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessible={false}
      accessibilityIgnoresInvertColors
    />
  );
}
