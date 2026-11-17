import { CRIA_PLAYERS, CRIA_SOURCES } from '@/data/cria/players';
import { CRIA_COMPETITIONS } from '@/data/cria/titles';
import type { CriaAttribute } from '@/data/cria/types';

/** Regras da base do Quem é o Cria? (src/data/cria/SOURCES.md). */

const ATTRS: CriaAttribute[] = ['position', 'nationality', 'arrivalYear', 'goals', 'matches', 'titles'];
const POSITIONS = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante'];
const sourceIds = new Set(CRIA_SOURCES.map((s) => s.id));

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

describe('base do Quem é o Cria?', () => {
  it('tem tamanho para o jogo: ~150 para chutar e 60+ para resposta', () => {
    expect(CRIA_PLAYERS.length).toBeGreaterThanOrEqual(150);
    expect(CRIA_PLAYERS.filter((p) => p.eligible).length).toBeGreaterThanOrEqual(60);
  });

  it('ids únicos', () => {
    expect(new Set(CRIA_PLAYERS.map((p) => p.id)).size).toBe(CRIA_PLAYERS.length);
  });

  it.each(CRIA_PLAYERS.map((p) => [p.id, p] as const))('%s: todo atributo tem fonte conhecida e confiança', (_, p) => {
    for (const a of ATTRS) {
      const ev = p.stats[a];
      expect(ev.sources.length).toBeGreaterThan(0);
      for (const s of [...ev.sources, ...(ev.closeTo ?? [])]) expect(sourceIds).toContain(s);
      expect(['confirmado', 'fonte_unica', 'pendente']).toContain(ev.confidence);
      if (ev.confidence === 'confirmado') expect(ev.sources.length).toBeGreaterThan(1);
    }
  });

  it.each(CRIA_PLAYERS.map((p) => [p.id, p] as const))('%s: valores dentro do possível', (_, p) => {
    expect(POSITIONS).toContain(p.position);
    expect(p.nationality).toMatch(/^[A-Z]{3}$/);
    expect(p.arrivalYear).toBeGreaterThanOrEqual(1912);
    expect(p.arrivalYear).toBeLessThanOrEqual(new Date().getFullYear());
    expect(p.matches).toBeGreaterThan(0);
    expect(p.goals).toBeGreaterThanOrEqual(0);
    expect(p.goals).toBeLessThanOrEqual(p.matches * 1.5);
    expect(p.photo).toBeNull();
    for (const t of p.titles) {
      const m = t.match(/^(.+)-(\d{4})e?$/);
      expect(m).not.toBeNull();
      expect(Object.keys(CRIA_COMPETITIONS)).toContain(m![1]);
      // título dentro de alguma passagem pelo clube (a temporada pode fechar no ano seguinte)
      const y = Number(m![2]);
      expect(p.spells.some((s) => y >= s.from && y <= (s.to ?? 9999) + 1)).toBe(true);
    }
  });

  it('só é resposta quem tem jogos e gols conferidos por uma segunda fonte e nada pendente', () => {
    for (const p of CRIA_PLAYERS) {
      const ok =
        ATTRS.every((a) => p.stats[a].confidence !== 'pendente') &&
        (['goals', 'matches'] as const).every(
          (a) => p.stats[a].confidence === 'confirmado' || (p.stats[a].closeTo?.length ?? 0) > 0
        );
      expect([p.id, p.eligible]).toEqual([p.id, ok]);
    }
  });

  it('respostas balanceadas por dificuldade e geração', () => {
    const elig = CRIA_PLAYERS.filter((p) => p.eligible);
    const by = (k: (p: (typeof elig)[number]) => string) =>
      elig.reduce<Record<string, number>>((a, p) => ((a[k(p)] = (a[k(p)] ?? 0) + 1), a), {});
    const diff = by((p) => p.difficulty);
    expect(diff.facil).toBeGreaterThanOrEqual(10);
    expect(diff.medio).toBeGreaterThanOrEqual(15);
    expect(diff.dificil).toBeGreaterThanOrEqual(10);
    // nenhuma geração (antes de 1970, 1970–1999, 2000 em diante) com menos de 15% das respostas
    const era = by((p) => (p.arrivalYear < 1970 ? 'antigo' : p.arrivalYear < 2000 ? 'classico' : 'recente'));
    for (const n of Object.values(era)) expect(n / elig.length).toBeGreaterThan(0.15);
  });

  it('nome e apelidos não colidem entre jogadores diferentes, salvo homônimos conhecidos', () => {
    // Homônimos de verdade: a busca mostra o período no clube para diferenciar.
    const HOMONYMS = new Set(['jorginho', 'juan', 'gerson', 'everton', 'julio cesar', 'gabriel']);
    const owner = new Map<string, string>();
    for (const p of CRIA_PLAYERS) {
      for (const n of new Set([p.name, ...p.aliases].map(norm))) {
        const prev = owner.get(n);
        if (prev && prev !== p.id && !HOMONYMS.has(n)) throw new Error(`"${n}" é de ${prev} e de ${p.id}`);
        owner.set(n, p.id);
      }
    }
  });
});
