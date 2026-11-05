/** Latência simulada para os estados de carregamento aparecerem como num app real. */
export function delay<T>(value: T, ms = 350 + Math.random() * 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredCloneSafe(value)), ms));
}

/** Cópia defensiva: a UI nunca recebe referências aos objetos internos do mock. */
export function structuredCloneSafe<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

export class NotFoundError extends Error {
  constructor(what: string, id: string) {
    super(`${what} não encontrado: ${id}`);
    this.name = 'NotFoundError';
  }
}

/** Hash determinístico simples (variações estáveis por id). */
export function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Remove acentos e pontuação, deixa minúsculo. */
export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ');
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
