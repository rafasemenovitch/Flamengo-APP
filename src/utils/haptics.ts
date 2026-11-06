import * as Haptics from 'expo-haptics';

/**
 * Vibrações curtas e consistentes. Silenciosamente ignoradas onde não há
 * suporte (web, simulador).
 */
export const haptic = {
  /** Toque leve: seleção, troca de aba interna. */
  select: () => Haptics.selectionAsync().catch(() => undefined),
  /** Confirmação: palpite salvo, compra concluída, voto. */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
  /** Impacto forte: gol. */
  goal: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined),
  /** Toque médio: abrir painel escondido. */
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined),
};
