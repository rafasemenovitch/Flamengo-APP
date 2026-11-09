import type { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import type { ProductCategory } from '@/types/commerce';
import type { CompetitionId } from '@/types/match';

export type TabParamList = {
  Inicio: undefined;
  Jogos: { initialTab?: 'calendario' | 'tabela' } | undefined;
  Ingressos: undefined;
  Nacao: undefined;
  Perfil: undefined;
};

/**
 * Telas internas ficam no stack raiz (acima das abas): abrem de qualquer
 * lugar com a mesma rota e escondem a tab bar, como nos apps de clubes.
 */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  // Jogos
  MatchDetail: { matchId: string };
  PlayerProfile: { playerId: string };
  Standings: { competitionId?: CompetitionId } | undefined;
  // Conteúdo
  News: undefined;
  FlaTV: undefined;
  NewsDetail: { articleId: string };
  VideoDetail: { videoId: string };
  Notifications: undefined;
  // Ingressos
  TicketPurchase: { matchId: string };
  TicketWallet: undefined;
  TicketDetail: { ticketId: string };
  FaceEnrollment: undefined;
  /** Aberto a todos; `sectorId` só destaca um setor (ex.: vindo do ingresso). */
  StadiumMode: { sectorId?: string; tab?: 'estadio' | 'chegar' | 'filas' } | undefined;
  // Nação
  Store: { category?: ProductCategory } | undefined;
  Product: { productId: string };
  Cart: undefined;
  CheckoutResult: { orderId: string; total: number; kind: 'store' | 'tickets' };
  Membership: undefined;
  Gamification: undefined;
  Trail: { tab?: 'trilha' | 'ganhar' | 'extrato' } | undefined;
  Rankings: undefined;
  Passport: undefined;
  Community: undefined;
  // Bolão
  Bolao: { tab?: 'palpites' | 'boloes' | 'regras' } | undefined;
  BolaoGuess: { matchId: string };
  BolaoPool: { poolId: string; tab?: 'classificacao' | 'rodada' | 'convidar' };
  BolaoCreate: undefined;
  BolaoJoin: { code?: string } | undefined;
  // Perfil
  Settings: undefined;
  EditProfile: undefined;
  Favorites: undefined;
  History: undefined;
  // Dev
  DesignSystem: undefined;
  // Assistente
  Assistant: { initialQuestion?: string } | undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    // Tipagem global do useNavigation().
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
