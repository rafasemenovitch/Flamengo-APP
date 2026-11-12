import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform } from 'react-native';

import { getSupabase, requireSupabase } from '@/services/supabase/client';
import { createFanProfile, loadFanProfile, updateFanProfile } from '@/services/supabase/profiles';
import type { FanProfile } from '@/types/fan';
import type { PersonalDetails } from './profileForm';

const GUEST_KEY = '@flamengo/auth-guest';

interface AuthContextValue {
  ready: boolean;
  session: Session | null;
  isGuest: boolean;
  enterAsGuest: () => Promise<void>;
  requestLogin: () => Promise<void>;
  signOut: () => Promise<void>;
  accountProfile: FanProfile | null;
  profileLoading: boolean;
  profileError: boolean;
  registering: boolean;
  reloadProfile: () => void;
  completeProfile: (details: PersonalDetails) => Promise<void>;
  updateAccountProfile: (patch: Partial<Omit<FanProfile, 'id'>>) => Promise<void>;
  register: (email: string, password: string, details: PersonalDetails) => Promise<Session | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [profileRevision, setProfileRevision] = useState(0);
  const profileRequest = useRef(0);
  const activeOwner = useRef<string | undefined>(undefined);
  const [profileRecord, setProfileRecord] = useState<{
    ownerId: string;
    profile: FanProfile | null;
    failed: boolean;
  } | null>(null);

  const ownerId = session?.user.id;
  // O perfil anterior fica invisível no mesmo render em que a conta muda.
  const ownRecord = ownerId && profileRecord?.ownerId === ownerId ? profileRecord : null;

  useEffect(() => {
    let active = true;
    const request = ++profileRequest.current;
    if (!session?.user || registering) return;
    const user = session.user;
    loadFanProfile(user).then(
      (profile) => {
        if (active && profileRequest.current === request)
          setProfileRecord({ ownerId: user.id, profile, failed: false });
      },
      () => {
        if (active && profileRequest.current === request)
          setProfileRecord({ ownerId: user.id, profile: null, failed: true });
      }
    );
    return () => {
      active = false;
    };
  }, [ownerId, profileRevision, registering, session?.user]);

  const reloadProfile = useCallback(() => setProfileRevision((value) => value + 1), []);

  const completeProfile = useCallback(
    async (details: PersonalDetails) => {
      if (!session?.user) throw new Error('NOT_SIGNED_IN');
      const profile = await createFanProfile(session.user, details);
      if (activeOwner.current !== session.user.id) return;
      profileRequest.current++;
      setProfileRecord({ ownerId: session.user.id, profile, failed: false });
    },
    [session]
  );

  const updateAccountProfile = useCallback(
    async (patch: Partial<Omit<FanProfile, 'id'>>) => {
      if (!session?.user) throw new Error('NOT_SIGNED_IN');
      const profile = await updateFanProfile(session.user, patch);
      if (activeOwner.current !== session.user.id) return;
      profileRequest.current++;
      setProfileRecord({ ownerId: session.user.id, profile, failed: false });
    },
    [session]
  );

  const register = useCallback(async (email: string, password: string, details: PersonalDetails) => {
    setRegistering(true);
    try {
      const { data, error } = await requireSupabase().auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) {
        const profile = await createFanProfile(data.session.user, details);
        if (activeOwner.current !== data.session.user.id) throw new Error('ACCOUNT_CHANGED');
        profileRequest.current++;
        setProfileRecord({ ownerId: data.session.user.id, profile, failed: false });
      }
      return data.session;
    } finally {
      setRegistering(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let authChanged = false;
    const supabase = getSupabase();
    const subscription = supabase?.auth.onAuthStateChange((_event, nextSession) => {
      authChanged = true;
      if (active) {
        activeOwner.current = nextSession?.user.id;
        setSession(nextSession);
        if (nextSession) setIsGuest(false);
      }
    }).data.subscription;

    Promise.all([
      AsyncStorage.getItem(GUEST_KEY),
      supabase ? supabase.auth.getSession() : Promise.resolve(null),
    ])
      .then(([guest, result]) => {
        if (!active) return;
        setIsGuest(guest === '1' && !result?.data.session);
        if (!authChanged) {
          activeOwner.current = result?.data.session?.user.id;
          setSession(result?.data.session ?? null);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true);
      });

    const refresh = (state: string | null | undefined) => {
      if (state === 'active') supabase?.auth.startAutoRefresh();
      else supabase?.auth.stopAutoRefresh();
    };
    if (Platform.OS !== 'web') refresh(AppState.currentState);
    const appSubscription = Platform.OS !== 'web' ? AppState.addEventListener('change', refresh) : null;

    return () => {
      active = false;
      subscription?.unsubscribe();
      appSubscription?.remove();
      if (Platform.OS !== 'web') supabase?.auth.stopAutoRefresh();
    };
  }, []);

  // Ao entrar numa conta, a escolha anterior de visitante deixa de valer.
  useEffect(() => {
    if (!session) return;
    AsyncStorage.removeItem(GUEST_KEY).catch(() => undefined);
  }, [session]);

  const enterAsGuest = useCallback(async () => {
    await AsyncStorage.setItem(GUEST_KEY, '1');
    setIsGuest(true);
  }, []);

  const requestLogin = useCallback(async () => {
    await AsyncStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    }
    await AsyncStorage.removeItem(GUEST_KEY);
    setSession(null);
    setIsGuest(false);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      session,
      isGuest: !session && isGuest,
      enterAsGuest,
      requestLogin,
      signOut,
      accountProfile: ownRecord?.profile ?? null,
      profileLoading: !!ownerId && !ownRecord,
      profileError: ownRecord?.failed ?? false,
      registering,
      reloadProfile,
      completeProfile,
      updateAccountProfile,
      register,
    }),
    [
      ready,
      session,
      isGuest,
      enterAsGuest,
      requestLogin,
      signOut,
      ownRecord,
      ownerId,
      registering,
      reloadProfile,
      completeProfile,
      updateAccountProfile,
      register,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.');
  return context;
}
