import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList, TabParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const TAB_ROUTES: ReadonlyArray<keyof TabParamList> = ['Inicio', 'Jogos', 'Ingressos', 'Nacao', 'Perfil'];

/**
 * Navega por NOME de rota vindo de dados (ex.: ações do Assistente), sem
 * saber se é aba ou tela do stack raiz. Rotas desconhecidas são ignoradas.
 */
export function navigateByName(route: string, params?: Record<string, string>) {
  if (!navigationRef.isReady()) return;
  if ((TAB_ROUTES as readonly string[]).includes(route)) {
    navigationRef.navigate('Tabs', { screen: route as keyof TabParamList });
    return;
  }
  const names = navigationRef.getRootState()?.routeNames ?? [];
  if (names.includes(route as keyof RootStackParamList)) {
    // Parâmetros vêm de dados não tipados; a validação é das telas.
    (navigationRef.navigate as (name: string, params?: object) => void)(route, params);
  }
}
