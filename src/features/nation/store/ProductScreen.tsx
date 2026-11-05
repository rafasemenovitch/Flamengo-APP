import { PlaceholderScreen } from '@/features/shared/PlaceholderScreen';
import type { RootScreenProps } from '@/navigation/types';

export function ProductScreen({ route }: RootScreenProps<'Product'>) {
  return <PlaceholderScreen title="Produto" icon="shirt" phase={3} description="Fotos (placeholder), tamanhos, preço com desconto de sócio e adicionar ao carrinho." details={[['Produto', route.params.productId]]} />;
}
