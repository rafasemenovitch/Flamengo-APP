import { useEffect, useRef, useState } from 'react';

import { useAlerts } from '@/design-system';
import {
  demoLocation,
  demoMember,
  demoScenario,
  IS_DEMO,
  services,
  type DemoLocation,
  type DemoScenario,
} from '@/services';
import type { MatchDetail } from '@/types/match';
import { navigationRef } from '@/navigation/navigationRef';
import { useAsync } from './useAsync';

/** Cenário demo atual (pré/dia de jogo/ao vivo/pós) com re-render ao mudar. */
/** Torcedor demo é sócio? (painel de demonstração) */
export function useDemoMember(): [boolean, (v: boolean) => void] {
  const [isMember, setIsMember] = useState(demoMember.get());
  useEffect(() => demoMember.subscribe(setIsMember), []);
  return [isMember, demoMember.set];
}

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
  // Atualização ao vivo guardada junto da carga que a originou: se a tela recarregar, ela é descartada.
  const [live, setLive] = useState<{ base: MatchDetail; match: MatchDetail }>();
  const { showAlert } = useAlerts();
  const prev = useRef<{ match: MatchDetail; scenarioSince: number } | undefined>(undefined);

  const base = state.data;
  useEffect(() => {
    if (!base) return;
    return services.matches.subscribeToMatch(base.id, (match) => setLive({ base, match }));
  }, [base]);

  const match = live && live.base === base ? live.match : base;

  useEffect(() => {
    if (!opts?.alerts || !match) return;
    // Só avisa sobre mudanças "ao vivo" (relógio do jogo). Recarregar a tela ou
    // trocar o cenário demo apenas redefine a referência, sem disparar alertas.
    const since = demoScenario.since();
    const last = prev.current;
    prev.current = { match, scenarioSince: since };
    if (!last || last.match.id !== match.id || last.scenarioSince !== since || match === state.data) return;
    const before = last.match;
    // O id inclui o início do cenário: ao repetir a demo, os alertas voltam a aparecer.
    const run = `${match.id}-${since}`;
    const goTo = () =>
      navigationRef.isReady() && navigationRef.navigate('MatchDetail', { matchId: match.id });
    const label = `${match.homeTeam.shortName} ${match.score?.home ?? 0} × ${match.score?.away ?? 0} ${match.awayTeam.shortName}`;
    if (before.status === 'scheduled' && (match.status === 'live' || match.status === 'halftime')) {
      showAlert({
        id: `start-${run}`,
        variant: 'matchStart',
        title: 'Bola rolando!',
        message: `${match.homeTeam.shortName} × ${match.awayTeam.shortName} começou.`,
        primary: { label: 'Acompanhar', onPress: goTo },
        secondary: { label: 'Fechar' },
      });
    }
    const goalsBefore = (before.score?.home ?? 0) + (before.score?.away ?? 0);
    const goalsNow = (match.score?.home ?? 0) + (match.score?.away ?? 0);
    if (goalsNow > goalsBefore) {
      const lastGoal = match.events.find((e) => e.type === 'goal' || e.type === 'penalty-goal');
      const flaScored = lastGoal?.side === (match.homeTeam.id === 'fla' ? 'home' : 'away');
      showAlert({
        id: `goal-${run}-${goalsNow}`,
        // Gol contra o Flamengo não ganha a tela vermelha de comemoração.
        variant: flaScored ? 'goal' : 'warning',
        pose: flaScored ? 'fan-goal' : 'fan-almost',
        priority: 'high',
        title: flaScored ? 'GOOOL DO MENGÃO!' : 'Gol do adversário',
        message: `${lastGoal?.playerName ? `${lastGoal.playerName} (${lastGoal.minute}). ` : ''}${label}`,
        primary: { label: 'Ver lance', onPress: goTo },
        secondary: { label: 'Fechar' },
      });
    }
    if (before.status !== 'finished' && match.status === 'finished') {
      const fla = match.homeTeam.id === 'fla' ? (match.score?.home ?? 0) : (match.score?.away ?? 0);
      const opp = match.homeTeam.id === 'fla' ? (match.score?.away ?? 0) : (match.score?.home ?? 0);
      showAlert({
        id: `end-${run}`,
        variant: 'matchEnd',
        pose: fla > opp ? 'fan-victory' : fla === opp ? 'fan-draw' : 'fan-defeat',
        title:
          fla > opp
            ? 'Vitória do Mengão!'
            : fla === opp
              ? 'Fim de jogo: empate'
              : 'Fim de jogo. Seguimos juntos.',
        message: label,
        primary: { label: 'Ver resumo', onPress: goTo },
        secondary: { label: 'Fechar' },
      });
    }
  }, [match, state.data, opts?.alerts, showAlert]);

  return { ...state, data: match, isDemo: IS_DEMO };
}

/** Posição simulada do painel de demonstração (Modo Maracanã). */
export function useDemoLocation(): [DemoLocation, (v: DemoLocation) => void] {
  const [loc, setLoc] = useState(demoLocation.get());
  useEffect(() => demoLocation.subscribe(setLoc), []);
  return [loc, demoLocation.set];
}
