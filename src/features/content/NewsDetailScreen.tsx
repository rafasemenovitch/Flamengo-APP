import { PlaceholderScreen } from '@/features/shared/PlaceholderScreen';
import type { RootScreenProps } from '@/navigation/types';

export function NewsDetailScreen({ route }: RootScreenProps<'NewsDetail'>) {
  return (
    <PlaceholderScreen title="Notícia" icon="newspaper" phase={2} description="Leitura da notícia com imagem, categoria, tempo de leitura e conteúdos relacionados." details={[['Notícia', route.params.articleId]]} />
  );
}
