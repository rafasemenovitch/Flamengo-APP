import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { ReactNode } from 'react';

import { Button, Text, ThemeProvider } from '@/design-system';
import { DEMO_FAN } from '@/data/demo/fan';
import { FEATURE_PRESENTATION, RESOURCE_GUIDES } from '@/features/guidance/content';
import { FeaturePresentation } from '@/features/guidance/FeaturePresentation';
import { FirstUseGuide } from '@/features/guidance/FirstUseGuide';
import { guidanceKey } from '@/features/guidance/storage';
import { OnboardingGate } from '@/features/onboarding/Onboarding';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
let mockOwner = 'visitor';
let mockFocused = true;
const mockUpdateProfile = jest.fn();
const mockFavorite = jest.fn();
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
  }),
}));
jest.mock('@/state/AppStateProvider', () => ({
  useAppState: () => ({
    profile: jest.requireActual('@/data/demo/fan').DEMO_FAN,
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

  it('segue de ídolos para os quatro recursos e depois alertas, num progresso único', async () => {
    await mount(
      <OnboardingGate>
        <Text>Aplicativo principal</Text>
      </OnboardingGate>
    );
    expect(has('Bem-vindo à Nação')).toBe(true);
    await press('Começar');
    await press('Entrar como visitante');
    expect(has('Quem são seus ídolos?')).toBe(true);
    await press('Continuar (2)');
    for (let page = 0; page < FEATURE_PRESENTATION.length; page++) {
      expect(has(FEATURE_PRESENTATION[page]!.title)).toBe(true);
      expect(has('Não perca nenhum gol')).toBe(false);
      const progress = screen.root
        .findAllByProps({ accessibilityRole: 'progressbar' })
        .find((control) => control.props.accessibilityLabel === `Passo ${page + 4} de 8`);
      expect(progress?.props.accessibilityValue).toEqual({ min: 1, max: 8, now: page + 4 });
      await press(page === FEATURE_PRESENTATION.length - 1 ? 'Continuar' : 'Próximo');
    }
    expect(has('Não perca nenhum gol')).toBe(true);
    expect(screen.root.findAllByType(Button).some((b) => b.props.label === 'Conhecer os recursos')).toBe(
      false
    );
    await press('Entrar no app');
    expect(has('Aplicativo principal')).toBe(true);
    expect(await AsyncStorage.getItem('@flamengo/onboarding-done')).toBe('1');
    expect(await AsyncStorage.getItem(guidanceKey(mockOwner, 'presentation'))).toBe('completed');
    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(mockFavorite).not.toHaveBeenCalled();
  });

  it('volta aos ídolos e dos alertas ao último recurso, sem alterar preferências', async () => {
    await mount(
      <OnboardingGate>
        <Text>Aplicativo principal</Text>
      </OnboardingGate>
    );
    await press('Começar');
    await press('Entrar como visitante');
    await press('Continuar (2)');
    expect(has('Explore o Maracanã')).toBe(true);
    await pressControl('Voltar');
    expect(has('Quem são seus ídolos?')).toBe(true);
    await press('Continuar (2)');
    await press('Próximo');
    expect(has('Seu ingresso, fácil de encontrar')).toBe(true);
    await pressControl('Pular recursos e ir para os alertas');
    expect(has('Não perca nenhum gol')).toBe(true);
    expect(has('Aplicativo principal')).toBe(false);
    expect(await AsyncStorage.getItem(guidanceKey(mockOwner, 'presentation'))).toBe('dismissed');
    await press('Voltar');
    expect(has('Conte com o Assistente Fla')).toBe(true);
    await pressControl('Voltar');
    expect(has('Participe da Nação')).toBe(true);
    await press('Próximo');
    await press('Continuar');
    expect(has('Não perca nenhum gol')).toBe(true);
    await press('Entrar no app');
    expect(has('Aplicativo principal')).toBe(true);
    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(mockFavorite).not.toHaveBeenCalled();
  });

  it('permite pular os recursos pelo rodapé e mantém a etapa de alertas', async () => {
    await mount(
      <OnboardingGate>
        <Text>Aplicativo principal</Text>
      </OnboardingGate>
    );
    await press('Começar');
    await press('Entrar como visitante');
    await press('Continuar (2)');
    await press('Pular recursos');
    expect(has('Não perca nenhum gol')).toBe(true);
    expect(has('Aplicativo principal')).toBe(false);
    expect(await AsyncStorage.getItem('@flamengo/onboarding-done')).toBeNull();
    expect(await AsyncStorage.getItem(guidanceKey(mockOwner, 'presentation'))).toBe('dismissed');
    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(mockFavorite).not.toHaveBeenCalled();
  });

  it('percorre quatro exemplos, permite voltar e conclui sem mudar a conta', async () => {
    const done = jest.fn();
    const before = JSON.stringify(DEMO_FAN);
    await mount(<FeaturePresentation onClose={done} />);
    for (let page = 0; page < FEATURE_PRESENTATION.length; page++) {
      expect(has(FEATURE_PRESENTATION[page]!.title)).toBe(true);
      if (page < 3) await press('Próximo');
    }
    await act(async () => {
      screen.root
        .findAllByProps({ accessibilityLabel: 'Voltar' })
        .find((p) => p.props.onPress)!
        .props.onPress();
    });
    expect(has('Participe da Nação')).toBe(true);
    await press('Próximo');
    await press('Concluir');
    expect(done).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem(guidanceKey(mockOwner, 'presentation'))).toBe('completed');
    expect(JSON.stringify(DEMO_FAN)).toBe(before);
    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(mockFavorite).not.toHaveBeenCalled();
  });

  it('pode encerrar na primeira tela e registra a dispensa', async () => {
    const done = jest.fn();
    await mount(<FeaturePresentation onClose={done} />);
    await press('Encerrar apresentação');
    expect(done).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem(guidanceKey(mockOwner, 'presentation'))).toBe('dismissed');
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

  it('mantém textos curtos e no máximo três passos por recurso', () => {
    for (const slide of FEATURE_PRESENTATION) expect(slide.body.split(/\s+/).length).toBeLessThanOrEqual(25);
    for (const guide of Object.values(RESOURCE_GUIDES)) expect(guide.steps.length).toBeLessThanOrEqual(3);
  });
});
