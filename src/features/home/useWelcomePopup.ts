import { useEffect } from 'react';

import { useAlerts } from '@/design-system';
import { navigateByName } from '@/navigation/navigationRef';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { MatchDetail } from '@/types/match';
import { formatNumber, formatTime } from '@/utils/format';

/** Uma vez por abertura do app (não a cada visita à Home). */
let shown = false;

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

/**
 * Pop-up de entrada com o mascote: em dia de jogo, convoca para o jogo e para
 * o palpite; nos outros dias, mostra quanto falta para o próximo prêmio.
 * Ao vivo ou depois do jogo não aparece (os avisos do jogo já falam por ele).
 */
export function useWelcomePopup(match: MatchDetail | undefined) {
  const { showAlert } = useAlerts();
  const { profile, progress } = useAppState();

  useEffect(() => {
    if (shown || !match || !profile || !progress) return;
    if (match.status !== 'scheduled') return;
    const go = (name: string, params?: Record<string, string>) => () => navigateByName(name, params);

    const timer = setTimeout(async () => {
      if (shown) return;
      shown = true;
      if (isToday(match.kickoff)) {
        const guess = await services.bolao.getMatch(match.id).catch(() => undefined);
        showAlert({
          id: `welcome-matchday-${match.id}`,
          variant: 'info',
          pose: 'fan-flag',
          priority: 'low',
          title: 'Hoje tem Mengão!',
          message: `${match.homeTeam.shortName} × ${match.awayTeam.shortName}, às ${formatTime(match.kickoff)} no ${match.venue.name}.${guess?.guess ? '' : ' Você ainda não deu seu palpite.'}`,
          primary: guess?.guess
            ? { label: 'Abrir Modo Maracanã', onPress: go('StadiumMode') }
            : { label: 'Dar meu palpite', onPress: go('BolaoGuess', { matchId: match.id }) },
          secondary: { label: 'Agora não' },
        });
        return;
      }
      const reward = progress.nextReward;
      showAlert({
        id: 'welcome-back',
        variant: 'info',
        pose: 'fan-welcome',
        priority: 'low',
        title: `Fala, ${profile.firstName}!`,
        message: reward
          ? `Faltam ${formatNumber(reward.points - progress.points)} pontos para ${reward.title.charAt(0).toLowerCase()}${reward.title.slice(1)}. O quiz do dia vale 10.`
          : 'Sua temporada está completa. Bora defender a posição no ranking?',
        primary: { label: 'Ver a trilha de prêmios', onPress: go('Trail') },
        secondary: { label: 'Agora não' },
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [match, profile, progress, showAlert]);
}
