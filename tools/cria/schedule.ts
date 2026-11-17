/**
 * Gera a agenda do Quem é o Cria? (um ano a partir do lançamento) com o id de cada dia
 * disfarçado. Rodar depois de mudar a base (`npm run cria:data`) ou as datas fixadas.
 *
 *   npm run cria:agenda
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { CRIA_PINS } from '../../src/data/cria/pins';
import { CRIA_DATA_VERSION, CRIA_PLAYERS } from '../../src/data/cria/players';
import { CRIA_LAUNCH } from '../../src/features/cria/dates';
import { encodeId, generateSchedule } from '../../src/features/cria/schedule';

const DAYS = 365;
const { gap, days } = generateSchedule(CRIA_PLAYERS, { start: CRIA_LAUNCH, days: DAYS, pins: CRIA_PINS });

const file = `/**
 * GERADO por tools/cria/schedule.ts (npm run cria:agenda). Não editar à mão.
 * Um item por dia a partir de \`start\`: o id do jogador secreto, disfarçado pela data
 * (decodeId em src/features/cria/schedule.ts).
 */
export const CRIA_SCHEDULE = {
  start: '${CRIA_LAUNCH}',
  dataVersion: '${CRIA_DATA_VERSION}',
  days: [
${days.map((d) => `    '${encodeId(d.id, d.date)}',`).join('\n')}
  ],
};
`;
writeFileSync(join(__dirname, '..', '..', 'src/data/cria/schedule.generated.ts'), file);

const count = new Map<string, number>();
for (const d of days) count.set(d.id, (count.get(d.id) ?? 0) + 1);
console.log(`${DAYS} dias a partir de ${CRIA_LAUNCH}, janela sem repetir: ${gap} dias, ${count.size} jogadores diferentes`);
