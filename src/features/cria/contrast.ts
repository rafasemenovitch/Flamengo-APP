import { useSyncExternalStore } from 'react';

/**
 * Alto contraste do Quem é o Cria? (laranja e azul no lugar de verde e amarelo, como no
 * modo daltônico dos jogos de palavra). Fica salvo no aparelho; vale para a grade, as
 * regras e o texto de compartilhar.
 */
const KEY = '@flamengo/cria-alto-contraste';
let on = false;
let loaded = false;
const listeners = new Set<() => void>();

const storage = async () => (await import('@react-native-async-storage/async-storage')).default;

function load() {
  if (loaded) return;
  loaded = true;
  storage()
    .then((s) => s.getItem(KEY))
    .then((v) => {
      if (v === '1') setHighContrast(true, false);
    })
    .catch(() => undefined);
}

export function setHighContrast(value: boolean, persist = true) {
  on = value;
  listeners.forEach((l) => l());
  if (persist)
    storage()
      .then((s) => s.setItem(KEY, value ? '1' : '0'))
      .catch(() => undefined);
}

const subscribe = (l: () => void) => {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useHighContrast = () => useSyncExternalStore(subscribe, () => on);
