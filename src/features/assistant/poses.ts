import type { ImageSourcePropType } from 'react-native';

import type { AssistantExpression, AssistantGesture } from '@/types/fan';

/**
 * Skin "modo assistente" do mascote (com headset). Usar SOMENTE no Assistente
 * Fla. Expressões: avatar ao lado das mensagens (trocáveis no mesmo lugar).
 * Gestos: ilustrações maiores. Não espelhar as imagens.
 */
export const EXPRESSION_FULL: Record<AssistantExpression, ImageSourcePropType> = {
  neutral: require('../../../assets/assistant/neutral.png'),
  wave: require('../../../assets/assistant/wave.png'),
  talking: require('../../../assets/assistant/talking.png'),
  thinking: require('../../../assets/assistant/thinking.png'),
  confused: require('../../../assets/assistant/confused.png'),
  sorry: require('../../../assets/assistant/sorry.png'),
  wink: require('../../../assets/assistant/wink.png'),
  happy: require('../../../assets/assistant/happy.png'),
};

/** Recorte do headset até a gola, para avatares pequenos (até ~48px). */
export const EXPRESSION_AVATAR: Record<AssistantExpression, ImageSourcePropType> = {
  neutral: require('../../../assets/assistant/avatar/neutral.png'),
  wave: require('../../../assets/assistant/avatar/wave.png'),
  talking: require('../../../assets/assistant/avatar/talking.png'),
  thinking: require('../../../assets/assistant/avatar/thinking.png'),
  confused: require('../../../assets/assistant/avatar/confused.png'),
  sorry: require('../../../assets/assistant/avatar/sorry.png'),
  wink: require('../../../assets/assistant/avatar/wink.png'),
  happy: require('../../../assets/assistant/avatar/happy.png'),
};

export const GESTURE: Record<AssistantGesture, ImageSourcePropType> = {
  salute: require('../../../assets/assistant/salute.png'),
  'point-side': require('../../../assets/assistant/point-side.png'),
  'point-up': require('../../../assets/assistant/point-up.png'),
  phone: require('../../../assets/assistant/phone.png'),
  magnifier: require('../../../assets/assistant/magnifier.png'),
  clipboard: require('../../../assets/assistant/clipboard.png'),
  map: require('../../../assets/assistant/map.png'),
  'open-arms': require('../../../assets/assistant/open-arms.png'),
};
