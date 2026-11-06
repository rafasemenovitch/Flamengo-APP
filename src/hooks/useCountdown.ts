import { useEffect, useState } from 'react';

import { countdownTo, type Countdown } from '@/utils/format';

/** Contagem regressiva que atualiza a cada segundo (ou minuto, se faltar mais de 1 dia). */
export function useCountdown(targetIso: string | undefined): Countdown | undefined {
  const [now, setNow] = useState(() => Date.now());
  const value = targetIso ? countdownTo(targetIso, now) : undefined;
  const interval = value && value.days >= 1 ? 30_000 : 1000;

  useEffect(() => {
    if (!targetIso) return;
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [targetIso, interval]);

  return value;
}
