import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import type { FanProfile } from '@/types/fan';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
let mockListener: (event: string, session: Session | null) => void;
const mockUnsubscribe = jest.fn();
const mockClient = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: (listener: typeof mockListener) => {
      mockListener = listener;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    },
    startAutoRefresh: jest.fn(),
    stopAutoRefresh: jest.fn(),
    signOut: jest.fn(),
  },
};
jest.mock('@/services/supabase/client', () => ({
  getSupabase: () => mockClient,
  requireSupabase: () => mockClient,
}));
const mockLoadProfile = jest.fn();
jest.mock('@/services/supabase/profiles', () => ({
  loadFanProfile: (...args: unknown[]) => mockLoadProfile(...args),
  createFanProfile: jest.fn(),
  updateFanProfile: jest.fn(),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('sessão real e escolha de visitante', () => {
  let state: ReturnType<typeof useAuth>;
  let screen: ReactTestRenderer;
  function Probe() {
    state = useAuth();
    return null;
  }
  const mount = async () => {
    await act(async () => {
      screen = create(
        <AuthProvider>
          <Probe />
        </AuthProvider>
      );
    });
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockClient.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockClient.auth.signOut.mockResolvedValue({ error: null });
    mockLoadProfile.mockResolvedValue(null);
  });
  afterEach(async () => {
    await act(async () => {
      screen?.unmount();
    });
  });

  it('restaura a escolha de visitante sem autenticar no Supabase', async () => {
    await AsyncStorage.setItem('@flamengo/auth-guest', '1');
    await mount();
    expect(state.ready).toBe(true);
    expect(state.isGuest).toBe(true);
    expect(state.session).toBeNull();
    await act(async () => {
      await state.requestLogin();
    });
    expect(state.isGuest).toBe(false);
    expect(await AsyncStorage.getItem('@flamengo/auth-guest')).toBeNull();
  });

  it('restaura uma sessão existente', async () => {
    await AsyncStorage.setItem('@flamengo/auth-guest', '1');
    const session = { user: { id: 'fan-1', email: 'fan@exemplo.com' } } as Session;
    mockClient.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    await mount();
    expect(state.ready).toBe(true);
    expect(state.session?.user.id).toBe('fan-1');
    expect(state.isGuest).toBe(false);
    await act(async () => {
      mockListener('SIGNED_OUT', null);
    });
    expect(state.isGuest).toBe(false);
  });

  it('não reativa um visitante antigo quando uma conta é desconectada', async () => {
    await AsyncStorage.setItem('@flamengo/auth-guest', '1');
    await mount();
    await act(async () => {
      mockListener('SIGNED_IN', { user: { id: 'fan-1' } } as Session);
    });
    expect(state.isGuest).toBe(false);
    await act(async () => {
      mockListener('SIGNED_OUT', null);
    });
    expect(state.session).toBeNull();
    expect(state.isGuest).toBe(false);
    expect(await AsyncStorage.getItem('@flamengo/auth-guest')).toBeNull();
  });

  it('encerra a sessão somente neste aparelho e não recria o perfil demo', async () => {
    await mount();
    await act(async () => {
      await state.signOut();
    });
    expect(mockClient.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(state.session).toBeNull();
    expect(state.isGuest).toBe(false);
  });

  it('esconde o perfil anterior imediatamente e ignora respostas de uma conta que saiu', async () => {
    let resolveA!: (value: FanProfile) => void;
    let resolveB!: (value: FanProfile) => void;
    mockLoadProfile.mockImplementation(
      (user: { id: string }) =>
        new Promise<FanProfile>((resolve) => {
          if (user.id === 'a') resolveA = resolve;
          else resolveB = resolve;
        })
    );
    await mount();
    await act(async () => {
      mockListener('SIGNED_IN', { user: { id: 'a' } } as Session);
    });
    expect(state.accountProfile).toBeNull();
    await act(async () => {
      mockListener('SIGNED_IN', { user: { id: 'b' } } as Session);
    });
    await act(async () => {
      resolveB({ id: 'b', name: 'Marina Teste', firstName: 'Marina' } as FanProfile);
    });
    expect(state.accountProfile?.firstName).toBe('Marina');
    await act(async () => {
      resolveA({ id: 'a', name: 'Rodrigo Teste', firstName: 'Rodrigo' } as FanProfile);
    });
    expect(state.accountProfile?.firstName).toBe('Marina');
    await act(async () => {
      mockListener('SIGNED_OUT', null);
    });
    expect(state.accountProfile).toBeNull();
  });

  it('distingue perfil incompleto de falha de conexão, sem usar dados demo', async () => {
    await mount();
    await act(async () => {
      mockListener('SIGNED_IN', { user: { id: 'a' } } as Session);
    });
    expect(state.profileLoading).toBe(false);
    expect(state.accountProfile).toBeNull();
    expect(state.profileError).toBe(false);
    mockLoadProfile.mockRejectedValueOnce(new Error('network'));
    await act(async () => {
      state.reloadProfile();
    });
    expect(state.profileError).toBe(true);
    expect(state.accountProfile).toBeNull();
  });
});
