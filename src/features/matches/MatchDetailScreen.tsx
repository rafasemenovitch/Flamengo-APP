import { PlaceholderScreen } from '@/features/shared/PlaceholderScreen';
import type { RootScreenProps } from '@/navigation/types';

export function MatchDetailScreen({ route }: RootScreenProps<'MatchDetail'>) {
  return (
    <PlaceholderScreen
      title="Partida"
      icon="stats-chart"
      phase={3}
      description="Detalhe da partida com as abas Resumo, Escalações, Lance a lance, Estatísticas e Confrontos."
      details={[['Partida', route.params.matchId]]}
    />
  );
}
