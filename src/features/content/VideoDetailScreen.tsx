import { PlaceholderScreen } from '@/features/shared/PlaceholderScreen';
import type { RootScreenProps } from '@/navigation/types';

export function VideoDetailScreen({ route }: RootScreenProps<'VideoDetail'>) {
  return (
    <PlaceholderScreen title="FlaTV" icon="play-circle" phase={2} description="Player de vídeo (placeholder, sem vídeos oficiais) com descrição e próximos vídeos." details={[['Vídeo', route.params.videoId]]} />
  );
}
