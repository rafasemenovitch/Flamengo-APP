import { PlaceholderScreen } from '@/features/shared/PlaceholderScreen';
import type { RootScreenProps } from '@/navigation/types';

export function TicketPurchaseScreen({ route }: RootScreenProps<'TicketPurchase'>) {
  return <PlaceholderScreen title="Comprar ingresso" icon="cart" phase={3} description="Escolha de setor, tipo de ingresso e quantidade. A compra é simulada e termina na tela “Compra simulada”." details={[['Partida', route.params.matchId]]} />;
}
