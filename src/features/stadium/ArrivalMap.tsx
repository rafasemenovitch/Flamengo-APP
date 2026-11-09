import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Button, Text, useTheme } from '@/design-system';
import type { LatLng, Stadium, TransportMode } from '@/types/stadium';
import { formatDistance, openDirections, suggestArrival, travelModeFor } from './directions';

export const TRANSPORT_ICON: Record<TransportMode, keyof typeof Ionicons.glyphMap> = {
  metro: 'subway-outline',
  train: 'train-outline',
  bus: 'bus-outline',
  brt: 'bus-outline',
  app: 'car-outline',
  walk: 'walk-outline',
};

/**
 * Mapa real (Apple Maps no iOS, Google no Android) com estádio, portões,
 * estações e a posição do torcedor; sugere o caminho e abre a rota real.
 */
export function ArrivalMap({ stadium }: { stadium: Stadium }) {
  const { colors, radius, scheme } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [user, setUser] = useState<LatLng>();
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);

  const locate = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDenied(true);
        return;
      }
      setDenied(false);
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const me = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setUser(me);
      mapRef.current?.fitToCoordinates([me, stadium.coords], {
        edgePadding: { top: 60, bottom: 60, left: 60, right: 60 },
        animated: true,
      });
    } catch {
      setDenied(true);
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status === 'granted') locate();
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestion = user ? suggestArrival(user, stadium.coords, stadium.transport) : undefined;

  return (
    <View style={{ gap: 16 }}>
      <View style={{ height: 300, borderRadius: radius.l, overflow: 'hidden' }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{ ...stadium.coords, latitudeDelta: 0.018, longitudeDelta: 0.018 }}
          showsUserLocation={!!user}
          showsPointsOfInterests={false}
          userInterfaceStyle={scheme}
          accessibilityLabel="Mapa da região do Maracanã"
        >
          <Marker coordinate={stadium.coords} title={stadium.name} pinColor={colors.accent} />
          {stadium.gates.map((g) => (
            <Marker key={g.id} coordinate={g.coords} title={g.label}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.accent,
                  borderWidth: 2,
                  borderColor: colors.inkOnRed,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="labelM" tone="onPrimary" style={{ fontSize: 11, lineHeight: 13 }}>
                  {g.id}
                </Text>
              </View>
            </Marker>
          ))}
          {stadium.transport.map((t) => (
            <Marker key={t.id} coordinate={t.coords} title={t.title}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: colors.bgCanvas,
                  borderWidth: 1.5,
                  borderColor: colors.inkPrimary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={TRANSPORT_ICON[t.mode]} size={16} color={colors.inkPrimary} />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {suggestion ? (
        suggestion.kind === 'walk' ? (
          <>
            <Text variant="titleM">Você está a {formatDistance(suggestion.toStadium)}: dá pra ir a pé</Text>
            <Button
              label="Rota a pé"
              icon="walk-outline"
              onPress={() => openDirections({ query: stadium.mapsQuery, label: stadium.name }, 'walking')}
              fullWidth
            />
          </>
        ) : (
          <>
            <View>
              <Text variant="overline" tone="secondary">
                Melhor caminho · {formatDistance(suggestion.toStadium)}
              </Text>
              <Text variant="titleM">
                {suggestion.point.title.replace(' — ', ' · ')} → Portão {suggestion.point.bestGateIds[0]}
              </Text>
            </View>
            <Button
              label="Traçar rota"
              icon="navigate-outline"
              onPress={() =>
                openDirections(
                  { query: suggestion.point.mapsQuery, label: suggestion.point.title },
                  travelModeFor(suggestion.point.mode)
                )
              }
              fullWidth
            />
          </>
        )
      ) : (
        <Button
          label={denied ? 'Liberar localização' : 'Usar minha localização'}
          icon="locate-outline"
          loading={locating}
          onPress={locate}
          fullWidth
        />
      )}
    </View>
  );
}
