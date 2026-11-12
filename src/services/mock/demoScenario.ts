/**
 * Cenário do jogo em destaque no modo demo. Alterado pelo seletor de
 * desenvolvimento (Home) para demonstrar os estados do card principal:
 * - upcoming: próximo jogo daqui a alguns dias
 * - matchday: jogo hoje (ativa banner e atalho do Modo Maracanã)
 * - live: ao vivo, com o relógio avançando (1 minuto de jogo a cada poucos segundos)
 * - finished: encerrado, com melhores momentos e enquete de craque do jogo
 */
export type DemoScenario = 'upcoming' | 'matchday' | 'live' | 'finished';

export const DEMO_SCENARIOS: { key: DemoScenario; label: string }[] = [
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

type MemberListener = (isMember: boolean) => void;
let member = true;
const memberListeners = new Set<MemberListener>();

/** Torcedor demo é sócio ou não (painel de demonstração). Muda o Perfil e o Sócio-Torcedor. */
export const demoMember = {
  get: () => member,
  set(next: boolean) {
    if (next === member) return;
    member = next;
    memberListeners.forEach((l) => l(next));
  },
  subscribe(listener: MemberListener) {
    memberListeners.add(listener);
    return () => {
      memberListeners.delete(listener);
    };
  },
};

/**
 * Posição simulada para apresentar o Modo Maracanã sem estar no estádio (painel de
 * demonstração). `real` usa o GPS do aparelho.
 */
export type DemoLocation =
  { kind: 'real' } | { kind: 'gate'; id: string } | { kind: 'seat' } | { kind: 'outside' };

type LocationListener = (loc: DemoLocation) => void;
let location: DemoLocation = { kind: 'real' };
const locationListeners = new Set<LocationListener>();

export const demoLocation = {
  get: () => location,
  set(next: DemoLocation) {
    location = next;
    locationListeners.forEach((l) => l(next));
  },
  subscribe(listener: LocationListener) {
    locationListeners.add(listener);
    return () => {
      locationListeners.delete(listener);
    };
  },
};
