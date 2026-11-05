/**
 * Datas do modo demo são RELATIVAS a hoje (o calendário nunca "envelhece"):
 * `demoDate(2, '21:30')` = depois de amanhã às 21h30, no fuso do aparelho.
 */
export function demoDate(dayOffset: number, time = '12:00') {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h ?? 12, m ?? 0, 0, 0);
  return d.toISOString();
}

export function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}
