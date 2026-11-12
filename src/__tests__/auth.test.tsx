import { TextInput } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { Button, ThemeProvider } from '@/design-system';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { authErrorMessage } from '@/features/auth/authErrors';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const mockEnterAsGuest = jest.fn();
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockVerifyOtp = jest.fn();
const mockResend = jest.fn();
let mockConfigured = true;

jest.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    session: null,
    enterAsGuest: mockEnterAsGuest,
    register: async (email: string, password: string, details: unknown) =>
      (await mockSignUp({ email, password, details })).data.session,
  }),
}));
jest.mock('@/services/supabase/client', () => ({
  get isSupabaseConfigured() {
    return mockConfigured;
  },
  requireSupabase: () => ({
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      verifyOtp: mockVerifyOtp,
      resend: mockResend,
    },
  }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('login, cadastro e visitante', () => {
  let screen: ReactTestRenderer;
  const next = jest.fn();
  const button = (label: string) => screen.root.findAllByType(Button).find((b) => b.props.label === label)!;
  const fill = async (label: string, value: string) => {
    await act(async () => {
      screen.root
        .findAllByType(TextInput)
        .find((input) => input.props.accessibilityLabel === label)!
        .props.onChangeText(value);
    });
  };
  const personal = async () => {
    await fill('Nome', 'Rodrigo');
    await fill('Sobrenome', 'Teste');
    await fill('CPF', '52998224725');
    await fill('Data de nascimento', '01011990');
    await fill('Torcedor desde', '2000');
  };
  const press = async (label: string) => {
    await act(async () => {
      await button(label).props.onPress();
    });
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigured = true;
    mockEnterAsGuest.mockResolvedValue(undefined);
    mockSignIn.mockResolvedValue({ data: {}, error: null });
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null });
    mockVerifyOtp.mockResolvedValue({ data: {}, error: null });
    await act(async () => {
      screen = create(
        <ThemeProvider>
          <AuthScreen onContinue={next} />
        </ThemeProvider>
      );
    });
  });
  afterEach(async () => {
    await act(async () => {
      screen.unmount();
    });
  });

  it('permite visitante sem criar uma conta no Supabase', async () => {
    await press('Entrar como visitante');
    expect(mockEnterAsGuest).toHaveBeenCalledTimes(1);
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('normaliza o e-mail e só avança quando o login é aceito', async () => {
    await fill('E-mail', ' Torcedor@Exemplo.com ');
    await fill('Senha', 'senha-segura');
    mockSignIn.mockResolvedValueOnce({ error: { code: 'invalid_credentials' } });
    await press('Entrar');
    expect(next).not.toHaveBeenCalled();
    expect(JSON.stringify(screen.toJSON())).toContain('E-mail ou senha incorretos');
    await press('Entrar');
    expect(mockSignIn).toHaveBeenLastCalledWith({ email: 'torcedor@exemplo.com', password: 'senha-segura' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('não envia cadastro com senhas diferentes', async () => {
    await press('Criar conta');
    await fill('E-mail', 'torcedor@exemplo.com');
    await fill('Senha', 'senha-segura');
    await fill('Confirmar senha', 'outra-senha');
    await press('Criar conta');
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(JSON.stringify(screen.toJSON())).toContain('As senhas precisam ser iguais');
  });

  it('entra direto quando o Supabase não exige confirmação de e-mail', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { session: { user: { id: 'fan-1' } } }, error: null });
    await press('Criar conta');
    await personal();
    await fill('E-mail', 'torcedor@exemplo.com');
    await fill('Senha', 'senha-segura');
    await fill('Confirmar senha', 'senha-segura');
    await press('Criar conta');
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  it('aguarda a confirmação do e-mail e rejeita códigos inválidos sem avançar', async () => {
    await press('Criar conta');
    await personal();
    await fill('E-mail', 'torcedor@exemplo.com');
    await fill('Senha', 'senha-segura');
    await fill('Confirmar senha', 'senha-segura');
    await press('Criar conta');
    expect(next).not.toHaveBeenCalled();
    await fill('Código de confirmação', '123456');
    mockVerifyOtp.mockResolvedValueOnce({ error: { code: 'otp_expired' } });
    await press('Confirmar e entrar');
    expect(next).not.toHaveBeenCalled();
    await press('Confirmar e entrar');
    expect(mockVerifyOtp).toHaveBeenLastCalledWith({
      email: 'torcedor@exemplo.com',
      token: '123456',
      type: 'signup',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('mantém visitante disponível quando o Supabase ainda não foi configurado', async () => {
    mockConfigured = false;
    await act(async () => {
      screen.update(
        <ThemeProvider>
          <AuthScreen onContinue={next} />
        </ThemeProvider>
      );
    });
    expect(button('Entrar').props.disabled).toBe(true);
    expect(button('Entrar como visitante').props.disabled).toBe(false);
    await press('Entrar como visitante');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('não mostra respostas técnicas ou segredos do servidor nas mensagens', () => {
    expect(authErrorMessage(new Error('server secret=private-value'))).not.toContain('private-value');
    expect(authErrorMessage(new Error('Network request failed'))).toContain('internet');
  });
});
