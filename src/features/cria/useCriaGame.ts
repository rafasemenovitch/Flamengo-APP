import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';

import { CRIA_PLAYERS } from '@/data/cria/players';
import { services } from '@/services';
import type { CriaGame, CriaRow } from '@/services/adapters/DailyGameService';

import { compare, isWin, toAttributes } from './compare';
import { MAX_GUESSES } from './constants';
import { challengeNumber, dayKey } from './dates';
import { periodLabel } from './search';

const byId = new Map(CRIA_PLAYERS.map((p) => [p.id, p]));

/** Prévia em memória para prints (rota com `secreto` e `palpites`): não salva nada. */
export function previewGame(secretId: string, guessIds: string[]): CriaGame | null {
  const secret = byId.get(secretId);
  if (!secret) return null;
  const row = (id: string): CriaRow => {
    const p = byId.get(id)!;
    return {
      playerId: p.id,
      name: p.name,
      period: periodLabel(p),
      clues: compare(toAttributes(p), toAttributes(secret)),
    };
  };
  const rows = guessIds.filter((id) => byId.has(id)).map(row);
  const won = rows.some((r) => isWin(r.clues));
  const status = won ? 'venceu' : rows.length >= MAX_GUESSES ? 'perdeu' : 'jogando';
  const date = dayKey();
  return {
    date,
    number: challengeNumber(date),
    rows,
    status,
    ...(status !== 'jogando' ? { secret: row(secret.id) } : {}),
  };
}

/**
 * A partida do dia pelo serviço (salva no aparelho). O dia fica fixo enquanto a tela está
 * aberta: quem começou antes da meia-noite termina o desafio que abriu. `newDay` avisa
 * quando já existe um desafio novo.
 */
export function useCriaGame(preview?: { secreto?: string; palpites?: string }) {
  const isPreview = !!preview?.secreto;
  const [game, setGame] = useState<CriaGame | null>(() =>
    isPreview ? previewGame(preview!.secreto!, (preview!.palpites ?? '').split(',').filter(Boolean)) : null
  );
  const [newDay, setNewDay] = useState<string | null>(null);
  const isFocused = useIsFocused();

  const open = useCallback(async (date?: string) => {
    const d = date ?? (await services.dailyGame.today());
    const next = await services.dailyGame.getGame(d);
    setNewDay(null);
    setGame(next);
  }, []);

  useEffect(() => {
    if (isPreview) return;
    let alive = true;
    services.dailyGame
      .today()
      .then((d) => services.dailyGame.getGame(d))
      .then((g) => {
        if (alive) setGame(g);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isPreview]);

  // Ao voltar para a tela ou a cada minuto: o dia virou?
  useEffect(() => {
    if (isPreview || !game || !isFocused) return;
    const check = () => services.dailyGame.today().then((d) => setNewDay(d !== game.date ? d : null));
    void check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [isPreview, game, isFocused]);

  const guess = useCallback(
    async (playerId: string) => {
      if (!game) return;
      if (isPreview) {
        setGame(previewGame(preview!.secreto!, [...game.rows.map((r) => r.playerId), playerId]));
        return;
      }
      setGame(await services.dailyGame.guess(game.date, playerId));
    },
    [game, isPreview, preview]
  );

  return { game, guess, newDay, openNewDay: () => open(newDay ?? undefined) };
}
