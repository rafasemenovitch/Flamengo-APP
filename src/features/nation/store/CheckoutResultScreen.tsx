import { PlaceholderScreen } from '@/features/shared/PlaceholderScreen';
import type { RootScreenProps } from '@/navigation/types';

export function CheckoutResultScreen({ route }: RootScreenProps<'CheckoutResult'>) {
  return <PlaceholderScreen title="Compra simulada" icon="checkmark-circle" phase={3} description="Confirmação de compra simulada, sem cobrança real." details={[['Pedido', route.params.orderId]]} />;
}
