import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

import type { LatLng, TransportMode, TransportPoint } from '@/types/stadium';

export type TravelMode = 'transit' | 'walking' | 'driving';

/** Distância em km entre dois pontos (fórmula de haversine). */
export function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) * Math.cos((b.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

/**
 * Sugestão simples de como chegar a partir da posição do torcedor: perto do
 * estádio, a pé; longe, o ponto de transporte (metrô/trem primeiro) mais
 * próximo do torcedor. As rotas reais vêm do app de mapas.
 */
export function suggestArrival(user: LatLng, stadium: LatLng, points: TransportPoint[]) {
  const toStadium = distanceKm(user, stadium);
  if (toStadium < 1.5) return { kind: 'walk' as const, toStadium };
  const rail = points.filter((p) => p.mode === 'metro' || p.mode === 'train');
  const ranked = (rail.length ? rail : points)
    .map((p) => ({ point: p, distance: distanceKm(user, p.coords) }))
    .sort((a, b) => a.distance - b.distance);
  return { kind: 'transport' as const, toStadium, point: ranked[0]!.point };
}

const MODE_TO_TRAVEL: Partial<Record<TransportMode, TravelMode>> = {
  metro: 'transit',
  train: 'transit',
  bus: 'transit',
  brt: 'transit',
  app: 'driving',
  walk: 'walking',
};
export const travelModeFor = (m: TransportMode): TravelMode => MODE_TO_TRAVEL[m] ?? 'transit';

type Destination = { query?: string; coords?: LatLng; label: string };

function googleUrl(dest: Destination, mode: TravelMode) {
  const d = dest.query
    ? encodeURIComponent(dest.query)
    : `${dest.coords!.latitude},${dest.coords!.longitude}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${d}&travelmode=${mode}`;
}

function appleUrl(dest: Destination, mode: TravelMode) {
  const d = dest.query
    ? encodeURIComponent(dest.query)
    : `${dest.coords!.latitude},${dest.coords!.longitude}`;
  const flag = mode === 'transit' ? 'r' : mode === 'walking' ? 'w' : 'd';
  return `http://maps.apple.com/?daddr=${d}&dirflg=${flag}`;
}

/** Abre a rota real (a partir da localização atual) no Google Maps ou Apple Maps. */
export function openDirections(dest: Destination, mode: TravelMode = 'transit') {
  const open = (url: string) =>
    Linking.openURL(url).catch(() => Alert.alert('Não foi possível abrir o mapa'));
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: `Rota até ${dest.label}`,
        options: ['Google Maps', 'Apple Maps', 'Cancelar'],
        cancelButtonIndex: 2,
      },
      (i) => {
        if (i === 0) open(googleUrl(dest, mode));
        if (i === 1) open(appleUrl(dest, mode));
      }
    );
  } else {
    open(googleUrl(dest, mode));
  }
}
