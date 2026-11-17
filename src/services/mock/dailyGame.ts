import { CRIA_DATA_VERSION, CRIA_PLAYERS } from '@/data/cria/players';
import { CRIA_SCHEDULE } from '@/data/cria/schedule.generated';
import type { CriaPlayer } from '@/data/cria/types';
import { MAX_GUESSES } from '@/features/cria/constants';
import { compare, isWin, toAttributes, type CriaAttributes } from '@/features/cria/compare';
import { addDays, challengeNumber, dayKey } from '@/features/cria/dates';
import { obfuscate, reveal, secretIdFor } from '@/features/cria/schedule';
import { periodLabel } from '@/features/cria/search';
import type { CriaGame, CriaRow, DailyGameService } from '@/services/adapters/DailyGameService';

/**
 * LocalDailyGameAdapter: agenda no app (disfarçada) e partidas no aparelho.
 *
 * Ao começar a partida do dia, o secreto é CONGELADO (nome, período e os seis atributos)
 * e salvo disfarçado junto com a versão da base. Cada palpite vira uma linha já comparada.
 * Assim uma atualização da base nunca muda as pistas de uma partida em andamento.
 */

const GAME_KEY = (date: string) => `@flamengo/cria/partida/${date}`;
const OFFSET_KEY = '@flamengo/cria/demo-dias';
const SECRET_KEY = (date: string) => `@flamengo/cria/demo-secreto/${date}`;

interface FrozenSecret {
  id: string;
  name: string;
  period: string;
  attrs: CriaAttributes;
}

interface SavedGame {
  v: 1;
  date: string;
  dataVersion: string;
  secret: string;
  rows: CriaRow[];
}

/** O pedaço do AsyncStorage que o jogo usa (injetável nos testes). */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// AsyncStorage só quando usado: o módulo é importado em testes sem o módulo nativo.
const asyncStorage = async (): Promise<KeyValueStore> =>
  (await import('@react-native-async-storage/async-storage')).default;

const byId = new Map(CRIA_PLAYERS.map((p) => [p.id, p]));
const eligible = CRIA_PLAYERS.filter((p) => p.eligible);

/** Depois do fim da agenda, um elegível por dia (determinístico) até a agenda ser renovada. */
function fallbackSecret(date: string): CriaPlayer {
  const n = Math.abs(challengeNumber(date));
  return eligible[n % eligible.length]!;
}

const rowOf = (p: Pick<CriaPlayer, 'id' | 'name'>, period: string, attrs: CriaAttributes, secret: CriaAttributes) => ({
  playerId: p.id,
  name: p.name,
  period,
  clues: compare(attrs, secret),
});

function toGame(saved: SavedGame): CriaGame {
  const won = saved.rows.some((r) => isWin(r.clues));
  const status = won ? 'venceu' : saved.rows.length >= MAX_GUESSES ? 'perdeu' : 'jogando';
  const game: CriaGame = { date: saved.date, number: challengeNumber(saved.date), rows: saved.rows, status };
  if (status !== 'jogando') {
    const s: FrozenSecret = JSON.parse(reveal(saved.secret, saved.date));
    game.secret = rowOf(s, s.period, s.attrs, s.attrs);
  }
  return game;
}

export function createLocalDailyGameService(store?: KeyValueStore): DailyGameService {
  const storage = async () => store ?? asyncStorage();
  const read = async <T>(key: string): Promise<T | null> => {
    try {
      const raw = await (await storage()).getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  };
  const write = async (key: string, value: unknown) => {
    try {
      await (await storage()).setItem(key, JSON.stringify(value));
    } catch {
      // sem armazenamento (navegador privado etc.): a partida vale só enquanto a tela está aberta
    }
  };
  const remove = async (key: string) => {
    try {
      await (await storage()).removeItem(key);
    } catch {
      // idem
    }
  };

  const today = async () => addDays(dayKey(), (await read<number>(OFFSET_KEY)) ?? 0);

  // Partidas abertas nesta sessão: garante a partida mesmo sem armazenamento.
  const memory = new Map<string, SavedGame>();

  async function load(date: string): Promise<SavedGame> {
    const cached = memory.get(date) ?? (await read<SavedGame>(GAME_KEY(date)));
    if (cached) {
      memory.set(date, cached);
      return cached;
    }
    const override = await read<string>(SECRET_KEY(date));
    const player =
      (override && byId.get(override)) || byId.get(secretIdFor(CRIA_SCHEDULE, date) ?? '') || fallbackSecret(date);
    const frozen: FrozenSecret = {
      id: player.id,
      name: player.name,
      period: periodLabel(player),
      attrs: toAttributes(player),
    };
    const saved: SavedGame = {
      v: 1,
      date,
      dataVersion: CRIA_DATA_VERSION,
      secret: obfuscate(JSON.stringify(frozen), date),
      rows: [],
    };
    memory.set(date, saved);
    await write(GAME_KEY(date), saved);
    return saved;
  }

  return {
    today,
    getGame: async (date) => toGame(await load(date)),
    async guess(date, playerId) {
      const saved = await load(date);
      const game = toGame(saved);
      const player = byId.get(playerId);
      if (game.status !== 'jogando' || !player || saved.rows.some((r) => r.playerId === playerId)) return game;
      const secret: FrozenSecret = JSON.parse(reveal(saved.secret, date));
      const next: SavedGame = {
        ...saved,
        rows: [...saved.rows, rowOf(player, periodLabel(player), toAttributes(player), secret.attrs)],
      };
      memory.set(date, next);
      await write(GAME_KEY(date), next);
      return toGame(next);
    },
    demo: {
      async nextDay() {
        await write(OFFSET_KEY, ((await read<number>(OFFSET_KEY)) ?? 0) + 1);
      },
      async realDay() {
        await remove(OFFSET_KEY);
      },
      async resetToday() {
        const d = await today();
        memory.delete(d);
        await remove(GAME_KEY(d));
      },
      async setSecret(playerId) {
        const d = await today();
        await write(SECRET_KEY(d), playerId);
        memory.delete(d);
        await remove(GAME_KEY(d));
      },
    },
  };
}
