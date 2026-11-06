import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  error: Error | undefined;
  /** Primeiro carregamento (mostrar skeleton). */
  loading: boolean;
  /** Recarregamento com dados já na tela (pull-to-refresh). */
  refreshing: boolean;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Padrão único de carregamento para hooks de feature: loading → data | error,
 * com refresh sem perder o conteúdo já exibido. Ignora respostas de chamadas
 * antigas (ex.: componente desmontado ou dependências mudaram).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList = []): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const callId = useRef(0);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const run = useCallback(async (mode: 'load' | 'refresh') => {
    const id = ++callId.current;
    if (mode === 'load') setLoading(true);
    else setRefreshing(true);
    try {
      const result = await fnRef.current();
      if (id !== callId.current) return;
      setData(result);
      setError(undefined);
    } catch (e) {
      if (id !== callId.current) return;
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (id === callId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    // Busca de dados ao montar/mudar dependências: o setState aqui é intencional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run('load');
    return () => {
      callId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = useCallback(() => run('refresh'), [run]);
  const reload = useCallback(() => run('load'), [run]);

  return { data, error, loading, refreshing, refresh, reload };
}
