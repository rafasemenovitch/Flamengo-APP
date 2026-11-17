import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';

import { services } from '@/services';

/** Estado do Quem é o Cria? de hoje para o card da Nação (lido de novo a cada foco). */
export type CriaStatus =
  | { state: 'novo' }
  | { state: 'andamento'; guesses: number }
  | { state: 'fim'; won: boolean; guesses: number };

export function useCriaStatus(): CriaStatus {
  const isFocused = useIsFocused();
  const [status, setStatus] = useState<CriaStatus>({ state: 'novo' });
  useEffect(() => {
    if (!isFocused) return;
    let alive = true;
    services.dailyGame
      .today()
      .then((d) => services.dailyGame.getGame(d))
      .then((g) => {
        if (!alive) return;
        setStatus(
          g.status !== 'jogando'
            ? { state: 'fim', won: g.status === 'venceu', guesses: g.rows.length }
            : g.rows.length
              ? { state: 'andamento', guesses: g.rows.length }
              : { state: 'novo' }
        );
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isFocused]);
  return status;
}
