const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const pad = (n: number) => String(n).padStart(2, '0');

export function formatTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}h${pad(d.getMinutes())}`;
}

function dayDiff(iso: string, now = new Date()) {
  const d = new Date(iso);
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((a - b) / 86_400_000);
}

/** "Hoje, 21h30" · "Amanhã, 16h00" · "sáb, 08 nov · 21h30" */
export function formatMatchDate(iso: string) {
  const d = new Date(iso);
  const diff = dayDiff(iso);
  if (diff === 0) return `hoje, ${formatTime(iso)}`;
  if (diff === 1) return `amanhã, ${formatTime(iso)}`;
  if (diff === -1) return `ontem, ${formatTime(iso)}`;
  return `${WEEKDAYS[d.getDay()]}, ${pad(d.getDate())} ${MONTHS[d.getMonth()]} · ${formatTime(iso)}`;
}

/** "08 nov" */
export function formatShortDate(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
}

/** "08/11/2026" */
export function formatFullDate(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "há 5 min" · "há 3 h" · "há 2 dias" */
export function formatRelative(iso: string, now = Date.now()) {
  const diffMin = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `há ${h} h`;
  const days = Math.round(h / 24);
  return days === 1 ? 'ontem' : `há ${days} dias`;
}

/** 1234.5 → "R$ 1.234,50" (formatação própria, independente do suporte a Intl do aparelho). */
export function formatCurrency(value: number) {
  const [int, dec] = Math.abs(value).toFixed(2).split('.');
  return `${value < 0 ? '-' : ''}R$ ${int!.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`;
}

/** 1_204_000 → "1,2 mi" · 98_500 → "98,5 mil" (sem Intl compact, que nem todo Hermes suporta). */
export function formatCompact(value: number) {
  const fmt = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');
  if (value >= 1_000_000) return `${fmt(value / 1_000_000)} mi`;
  if (value >= 1_000) return `${fmt(value / 1_000)} mil`;
  return String(value);
}

export function formatNumber(value: number) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 312 → "5:12" */
export function formatDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function countdownTo(iso: string, now = Date.now()): Countdown {
  const totalMs = Math.max(0, new Date(iso).getTime() - now);
  const s = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    totalMs,
  };
}

export function pad2(n: number) {
  return pad(n);
}

/** Desloca um horário ISO em minutos e devolve "20h00". */
export function shiftTime(iso: string, minutes: number) {
  return formatTime(new Date(new Date(iso).getTime() + minutes * 60_000).toISOString());
}
