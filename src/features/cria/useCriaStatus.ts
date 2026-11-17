/**
 * Estado do Quem é o Cria? de hoje para o card da Nação.
 *
 * Por enquanto a partida não fica salva (etapa 5 do plano): o card sempre mostra "Jogar".
 * Na etapa 5 este hook passa a ler o progresso salvo (DailyGameService).
 */
export type CriaStatus =
  | { state: 'novo' }
  | { state: 'andamento'; guesses: number }
  | { state: 'fim'; won: boolean; guesses: number };

export function useCriaStatus(): CriaStatus {
  return { state: 'novo' };
}
