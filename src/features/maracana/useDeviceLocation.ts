import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

export type LocationStatus =
  /** Ainda não pediu (a permissão só é pedida quando o torcedor toca em "Minha localização"). */
  | 'idle'
  /** Mostrando a explicação antes do pedido do sistema. */
  | 'explain'
  | 'locating'
  | 'ok'
  | 'denied'
  /** Localização do aparelho desligada. */
  | 'off'
  | 'error';

export interface DevicePosition {
  lng: number;
  lat: number;
  /** Raio de precisão em metros. */
  accuracy: number;
}

/**
 * GPS do aparelho para o Modo Maracanã. Só pede permissão depois que a pessoa aceita a
 * explicação (`accept`) e só acompanha a posição enquanto a tela está aberta.
 */
export function useDeviceLocation() {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [position, setPosition] = useState<DevicePosition | null>(null);
  const watch = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => () => watch.current?.remove(), []);

  const start = useCallback(async () => {
    setStatus('locating');
    try {
      if (!(await Location.hasServicesEnabledAsync())) {
        setStatus('off');
        return;
      }
      watch.current?.remove();
      watch.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 2, timeInterval: 2000 },
        (p) => {
          setPosition({ lng: p.coords.longitude, lat: p.coords.latitude, accuracy: p.coords.accuracy ?? 50 });
          setStatus('ok');
        }
      );
    } catch {
      setStatus('error');
    }
  }, []);

  /** Toque em "Minha localização": usa a permissão que já existe ou explica antes de pedir. */
  const request = useCallback(async () => {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.granted) return start();
      setStatus(perm.canAskAgain ? 'explain' : 'denied');
    } catch {
      setStatus('error');
    }
  }, [start]);

  /** A pessoa aceitou a explicação: agora sim, o pedido do sistema. */
  const accept = useCallback(async () => {
    const perm = await Location.requestForegroundPermissionsAsync().catch(() => null);
    if (perm?.granted) return start();
    setStatus('denied');
  }, [start]);

  const dismiss = useCallback(() => setStatus((s) => (s === 'ok' || s === 'locating' ? s : 'idle')), []);

  return { status, position, request, accept, dismiss };
}
