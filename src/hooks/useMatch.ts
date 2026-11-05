import { useEffect, useRef, useState } from 'react';

import { useAlerts } from '@/design-system';
import { demoScenario, IS_DEMO, services, type DemoScenario } from '@/services';
import type { MatchDetail } from '@/types/match';
import { navigationRef } from '@/navigation/navigationRef';
import { useAsync } from './useAsync';

/** Cenário demo atual (pré/dia de jogo/ao vivo/pós) com re-render ao mudar. */
export function useDemoScenario(): [DemoScenario, (s: DemoScenario) => void] {
  const [scenario, setScenario] = useState(demoScenario.get());
  useEffect(() => demoScenario.subscribe(setScenario), []);
  return [scenario, demoScenario.set];
}

/**
 * Partida com atualizações ao vivo. Com `alerts`, dispara os avisos in-app
 * de início de jogo, gol e fim de jogo (fila do AlertHost).
 */
export function useLiveMatch(load: () => Promise<MatchDetail>, deps: unknown[], opts?: { alerts?: boolean }) {
  const state = useAsync(load, deps);
  const [live, setLive] = useState<MatchDetail>();
  const { showAlert } = useAlerts();
  const prev = useRef<MatchDetail | undefined>(undefined);

  useEffect(() => setLive(undefined), [state.data]);

  const matchId = state.data?.id;
  useEffect(() => {
    if (!matchId) return;
    return services.matches.subscribeToMatch(matchId, setLive);
  }, [matchId]);

  const match = live ?? state.data;

  useEffect(() => {
    if (!opts?.alerts || !match) return;
    const before = prev.current;
    prev.current = match;
    if (!before || before.id !== match.id) return;
    const goTo = () => navigationRef.isReady() && navigationRef.navigate('MatchDetail', { matchId: match.id });
    const label = `${match.homeTeam.shortName} ${match.score?.home ?? 0} × ${match.score?.away ?? 0} ${match.awayTeam.shortName}`;
    if (before.status === 'scheduled' && (match.status === 'live' || match.status === 'halftime')) {
      showAlert({ id: `start-${match.id}`, variant: 'matchStart', title: 'Bola rolando!', message: `${match.homeTeam.shortName} × ${match.awayTeam.shortName} começou.`, primary: { label: 'Acompanhar', onPress: goTo }, secondary: { label: 'Fechar' } });
    }
    const goalsBefore = (before.score?.home ?? 0) + (before.score?.away ?? 0);
    const goalsNow = (match.score?.home ?? 0) + (match.score?.away ?? 0);
    if (goalsNow > goalsBefore) {
      const lastGoal = match.events.find((e) => e.type === 'goal' || e.type === 'penalty-goal');
      const flaScored = lastGoal?.side === (match.homeTeam.id === 'fla' ? 'home' : 'away');
      showAlert({
        id: `goal-${match.id}-${goalsNow}`,
        variant: 'goal',
        priority: 'high',
        title: flaScored ? 'GOOOL DO MENGÃO!' : 'Gol do adversário',
        message: `${lastGoal?.playerName ? `${lastGoal.playerName} (${lastGoal.minute}). ` : ''}${label}`,
        primary: { label: 'Ver lance', onPress: goTo },
        secondary: { label: 'Fechar' },
      });
    }
    if (before.status !== 'finished' && match.status === 'finished') {
      showAlert({ id: `end-${match.id}`, variant: 'matchEnd', title: 'Fim de jogo', message: label, primary: { label: 'Ver resumo', onPress: goTo }, secondary: { label: 'Fechar' } });
    }
  }, [match, opts?.alerts, showAlert]);

  return { ...state, data: match, isDemo: IS_DEMO };
}
