import { PlaceholderScreen } from '@/features/shared/PlaceholderScreen';
import type { RootScreenProps } from '@/navigation/types';

export function PlayerProfileScreen({ route }: RootScreenProps<'PlayerProfile'>) {
  return (
    <PlaceholderScreen
      title="Jogador"
      icon="person"
      phase={3}
      description="Perfil do jogador: dados, números da temporada, notícias e vídeos relacionados, e opção de favoritar."
      details={[['Jogador', route.params.playerId]]}
    />
  );
}
