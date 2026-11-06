import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface FabCtx {
  visible: boolean;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const Ctx = createContext<FabCtx | null>(null);

/** Esconde o FAB ao rolar para baixo e mostra ao rolar para cima (especificação 12.15). */
export function FabVisibilityProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastY.current;
    lastY.current = y;
    if (y < 40) setVisible(true);
    else if (dy > 6) setVisible(false);
    else if (dy < -6) setVisible(true);
  }, []);
  const value = useMemo(() => ({ visible, onScroll }), [visible, onScroll]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFabVisibility() {
  return useContext(Ctx);
}
