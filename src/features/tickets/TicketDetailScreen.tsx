import { PlaceholderScreen } from '@/features/shared/PlaceholderScreen';
import type { RootScreenProps } from '@/navigation/types';

export function TicketDetailScreen({ route }: RootScreenProps<'TicketDetail'>) {
  return <PlaceholderScreen title="Ingresso" icon="qr-code" phase={3} description="Ingresso em tela cheia com QR demonstrativo (marca d'água), setor, portão e lugar." details={[['Ingresso', route.params.ticketId]]} />;
}
