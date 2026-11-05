import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

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
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<FanProfile | null>(null);
  const [progress, setProgress] = useState<FanProgress | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);

  const refreshProgress = useCallback(async () => {
    setProgress(await services.gamification.getProgress());
  }, []);

  useEffect(() => {
    services.profile.getProfile().then(setProfile).catch(() => undefined);
    services.store.getCart().then(setCart).catch(() => undefined);
    refreshProgress().catch(() => undefined);
  }, [refreshProgress]);

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
    }),
    [profile, progress, cart, updateProfile, toggleFavoritePlayer, refreshProgress]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState precisa estar dentro de <AppStateProvider>.');
  return ctx;
}
