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

import { useAlerts } from '@/design-system';
import { navigateByName } from '@/navigation/navigationRef';
import { services } from '@/services';
import type { Cart } from '@/types/commerce';
import type { FanProfile } from '@/types/fan';
import type { FanProgress } from '@/types/gamification';

/**
 * Estado global mínimo, compartilhado entre abas: perfil do torcedor
 * (favoritos alimentam o "Para você"), progresso de pontos (badge do header)
 * e carrinho (badge da loja). Todo o resto é carregado por tela via hooks.
 */
interface AppState {
  profile: FanProfile | null;
  progress: FanProgress | null;
  cart: Cart | null;
  updateProfile: (patch: Partial<Omit<FanProfile, 'id'>>) => Promise<void>;
  toggleFavoritePlayer: (playerId: string) => Promise<void>;
  refreshProgress: () => Promise<void>;
  setCart: (cart: Cart) => void;
  cartCount: number;
  unreadNotifications: number;
  refreshNotifications: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<FanProfile | null>(null);
  const [progress, setProgress] = useState<FanProgress | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [unreadNotifications, setUnread] = useState(0);

  const refreshNotifications = useCallback(async () => {
    const list = await services.profile.getNotifications();
    setUnread(list.filter((n) => !n.read).length);
  }, []);

  const { showAlert } = useAlerts();
  const lastLevel = useRef<number | undefined>(undefined);

  const refreshProgress = useCallback(async () => {
    const next = await services.gamification.getProgress();
    // Subiu de nível na temporada: pop-up com o mascote segurando a estrela.
    if (lastLevel.current !== undefined && next.level.level > lastLevel.current) {
      showAlert({
        id: `level-${next.season.year}-${next.level.level}`,
        variant: 'achievement',
        pose: 'fan-level-up',
        priority: 'high',
        title: `Você chegou ao nível ${next.level.name}!`,
        message: 'Tem prêmio novo liberado na trilha da temporada.',
        primary: { label: 'Ver a trilha', onPress: () => navigateByName('Trail') },
        secondary: { label: 'Fechar' },
      });
    }
    lastLevel.current = next.level.level;
    setProgress(next);
  }, [showAlert]);

  useEffect(() => {
    services.profile
      .getProfile()
      .then(setProfile)
      .catch(() => undefined);
    services.store
      .getCart()
      .then(setCart)
      .catch(() => undefined);
    // Carga inicial assíncrona; o setState acontece depois da resposta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProgress().catch(() => undefined);
    refreshNotifications().catch(() => undefined);
  }, [refreshProgress, refreshNotifications]);

  const updateProfile = useCallback(async (patch: Partial<Omit<FanProfile, 'id'>>) => {
    // Otimista: a UI responde na hora; o serviço confirma depois.
    setProfile((p) => (p ? { ...p, ...patch } : p));
    setProfile(await services.profile.updateProfile(patch));
  }, []);

  const toggleFavoritePlayer = useCallback(
    async (playerId: string) => {
      if (!profile) return;
      const favs = profile.favoritePlayerIds.includes(playerId)
        ? profile.favoritePlayerIds.filter((id) => id !== playerId)
        : [...profile.favoritePlayerIds, playerId];
      await updateProfile({ favoritePlayerIds: favs });
    },
    [profile, updateProfile]
  );

  const value = useMemo<AppState>(
    () => ({
      profile,
      progress,
      cart,
      updateProfile,
      toggleFavoritePlayer,
      refreshProgress,
      setCart,
      cartCount: cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0,
      unreadNotifications,
      refreshNotifications,
    }),
    [
      profile,
      progress,
      cart,
      updateProfile,
      toggleFavoritePlayer,
      refreshProgress,
      unreadNotifications,
      refreshNotifications,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState precisa estar dentro de <AppStateProvider>.');
  return ctx;
}
