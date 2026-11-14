import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { ReactNode } from 'react';

import { Button, Mascot, Text, ThemeProvider } from '@/design-system';
import { DEMO_FAN } from '@/data/demo/fan';
import { RESOURCE_GUIDES } from '@/features/guidance/content';
import { FirstUseGuide } from '@/features/guidance/FirstUseGuide';
import { guidanceKey } from '@/features/guidance/storage';
import { OnboardingGate } from '@/features/onboarding/Onboarding';
import { WelcomeCarousel } from '@/features/onboarding/WelcomeCarousel';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
let mockOwner = 'visitor';
let mockFocused = true;
const mockUpdateProfile = jest.fn();
const mockFavorite = jest.fn();
const mockEnterAsGuest = jest.fn(async () => undefined);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: () => mockFocused,
}));
jest.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    ready: true,
    session: mockOwner === 'visitor' ? null : { user: { id: mockOwner } },
    isGuest: true,
    accountProfile: null,
    registering: false,
    enterAsGuest: mockEnterAsGuest,
  }),
}));
jest.mock('@/state/AppStateProvider', () => ({
  useAppState: () => ({
    profile: {
      ...jest.requireActual('@/data/demo/fan').DEMO_FAN,
      favoritePlayerIds: ['p1', 'p2'],
    },
    updateProfile: mockUpdateProfile,
    toggleFavoritePlayer: mockFavorite,
  }),
}));
jest.mock('@/hooks/useAsync', () => ({ useAsync: () => ({ data: [], loading: false }) }));
jest.mock('@/services', () => ({ services: { matches: { getSquad: jest.fn() } } }));
jest.mock('@/features/auth/AuthScreen', () => ({
  AuthScreen: ({ onContinue }: { onContinue: () => void }) => {
    const Button = jest.requireActual('@/design-system').Button;
    return <Button label="Entrar como visitante" onPress={onContinue} />;
  },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const wrap = (child: ReactNode) => (
  <SafeAreaProvider initialMetrics={metrics}>
    <ThemeProvider>{child}</ThemeProvider>
  </SafeAreaProvider>
);

describe('recursos nas boas-vindas e primeiro uso', () => {
  let screen: ReactTestRenderer;
  let run = 0;
  const mount = async (child: ReactNode) => {
    await act(async () => {
      screen = create(wrap(child));
    });
  };
  const press = async (label: string) => {
    await act(async () => {
      await screen.root
        .findAllByType(Button)
        .find((button) => button.props.label === label)!
        .props.onPress();
    });
  };
  const has = (value: string) =>
    screen.root.findAllByType(Text).some((text) => text.props.children === value);
  const pressControl = async (label: string) => {
    await act(async () => {
      screen.root
        .findAllByProps({ accessibilityLabel: label })
        .find((control) => control.props.onPress)!
        .props.onPress();
    });
  };
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockFocused = true;
    mockOwner = `test-${++run}`;
  });
  afterEach(async () => {
    await act(async () => {
      screen?.unmount();
    });
  });

  it('boas-vindas: carrossel, conta, ídolos e alertas, sem mexer nas preferências', async () => {
    await mount(
      <OnboardingGate>
        <Text>Aplicativo principal</Text>
      </OnboardingGate>
    );
    expect(has('O Flamengo inteiro num app só')).toBe(true);
    await press('Criar conta ou entrar');
    await press('Entrar como visitante');
    expect(has('Seus ídolos')).toBe(true);
    const progress = screen.root
      .findAllByProps({ accessibilityRole: 'progressbar' })
      .find((control) => control.props.accessibilityLabel === 'Passo 2 de 3');
    expect(progress).toBeDefined();
    await press('Continuar com 2');
    expect(has('Não perca nenhum gol')).toBe(true);
    await press('Entrar no app');
    expect(has('Aplicativo principal')).toBe(true);
    expect(await AsyncStorage.getItem('@flamengo/onboarding-done')).toBe('1');
    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(mockFavorite).not.toHaveBeenCalled();
  });

  it('entra como visitante direto do carrossel', async () => {
    await mount(
      <OnboardingGate>
        <Text>Aplicativo principal</Text>
      </OnboardingGate>
    );
    await press('Entrar como visitante');
    expect(mockEnterAsGuest).toHaveBeenCalledTimes(1);
    expect(has('Seus ídolos')).toBe(true);
  });

  it('volta dos alertas aos ídolos e pula direto para o app', async () => {
    await mount(
      <OnboardingGate>
        <Text>Aplicativo principal</Text>
      </OnboardingGate>
    );
    await press('Criar conta ou entrar');
    await press('Entrar como visitante');
    await press('Continuar com 2');
    await pressControl('Voltar');
    expect(has('Seus ídolos')).toBe(true);
    await pressControl('Pular e entrar no app');
    expect(has('Aplicativo principal')).toBe(true);
    expect(await AsyncStorage.getItem('@flamengo/onboarding-done')).toBe('1');
  });

  it('o carrossel mostra as seis áreas, com o Modo Maracanã em 3D e sem mascote', async () => {
    await mount(<WelcomeCarousel onStart={jest.fn()} onGuest={jest.fn()} />);
    for (const kicker of [
      'Bem-vindo à Nação',
      'Dia de jogo',
      'Modo Maracanã',
      'Ingressos',
      'Nação',
      'Assistente Fla',
    ])
      expect(has(kicker)).toBe(true);
    expect(has('O estádio em 3D, do portão ao seu lugar')).toBe(true);
    expect(screen.root.findAllByType(Mascot)).toHaveLength(0);
  });

  it('"Rever apresentação" percorre as telas e fecha sem mudar a conta', async () => {
    const done = jest.fn();
    const before = JSON.stringify(DEMO_FAN);
    await mount(<WelcomeCarousel mode="tour" onClose={done} />);
    for (let i = 0; i < 5; i++) await press('Próxima');
    await press('Pronto');
    expect(done).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(DEMO_FAN)).toBe(before);
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('guarda a dica vista e não a repete ao voltar ao recurso', async () => {
    await mount(<FirstUseGuide resource="tickets" />);
    expect(has('Do ingresso ao seu setor')).toBe(true);
    expect(await AsyncStorage.getItem(guidanceKey(mockOwner, 'tickets'))).toBe('seen');
    mockFocused = false;
    await act(async () => {
      screen.update(wrap(<FirstUseGuide resource="tickets" />));
    });
    mockFocused = true;
    await act(async () => {
      screen.update(wrap(<FirstUseGuide resource="tickets" />));
    });
    expect(has('Do ingresso ao seu setor')).toBe(false);
  });

  it('separa contas e mantém orientações disponíveis para visitantes', async () => {
    await mount(<FirstUseGuide resource="assistant" />);
    await press('Agora não');
    expect(await AsyncStorage.getItem(guidanceKey(mockOwner, 'assistant'))).toBe('dismissed');
    mockOwner = 'visitor';
    await act(async () => {
      screen.update(wrap(<FirstUseGuide resource="assistant" />));
    });
    expect(has('Uma pergunta por vez')).toBe(true);
    await press('Entendi');
    expect(await AsyncStorage.getItem(guidanceKey('visitor', 'assistant'))).toBe('completed');
  });

  it('não marca uma dica escondida pelo carregamento do mapa', async () => {
    await mount(<FirstUseGuide resource="maracana" enabled={false} />);
    expect(await AsyncStorage.getItem(guidanceKey(mockOwner, 'maracana'))).toBeNull();
    await act(async () => {
      screen.update(wrap(<FirstUseGuide resource="maracana" enabled />));
    });
    expect(has('Seu caminho no estádio')).toBe(true);
  });

  it('mantém no máximo três passos por dica de recurso', () => {
    for (const guide of Object.values(RESOURCE_GUIDES)) expect(guide.steps.length).toBeLessThanOrEqual(3);
  });
});
