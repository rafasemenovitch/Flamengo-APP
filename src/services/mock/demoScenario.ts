/**
 * Cenário do jogo em destaque no modo demo. Alterado pelo seletor de
 * desenvolvimento (Home) para demonstrar os estados do card principal:
 * - upcoming: próximo jogo daqui a alguns dias
 * - matchday: jogo hoje (ativa banner e atalho do Modo Maracanã)
 * - live: ao vivo, com o relógio avançando (1 minuto de jogo a cada poucos segundos)
 * - finished: encerrado, com melhores momentos e enquete de craque do jogo
 */
export type DemoScenario = 'upcoming' | 'matchday' | 'live' | 'finished';

export const DEMO_SCENARIOS: Array<{ key: DemoScenario; label: string }> = [
  { key: 'upcoming', label: 'Pré-jogo' },
  { key: 'matchday', label: 'Dia de jogo' },
  { key: 'live', label: 'Ao vivo' },
  { key: 'finished', label: 'Pós-jogo' },
];

/** Segundos reais por minuto de jogo no cenário ao vivo. */
export const LIVE_SECONDS_PER_MINUTE = 4;

type Listener = (scenario: DemoScenario) => void;

let current: DemoScenario = 'matchday';
let changedAt = Date.now();
const listeners = new Set<Listener>();

export const demoScenario = {
  get: () => current,
  /** Momento em que o cenário atual começou (usado pelo relógio ao vivo). */
  since: () => changedAt,
  set(next: DemoScenario) {
    if (next === current) return;
    current = next;
    changedAt = Date.now();
    listeners.forEach((l) => l(next));
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
