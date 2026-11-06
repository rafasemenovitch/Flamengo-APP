import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Button, Card, Text, useTheme } from '@/design-system';
import type { LatLng, Stadium, TransportMode } from '@/types/stadium';
import { formatDistance, openDirections, suggestArrival, travelModeFor } from './directions';

export const TRANSPORT_ICON: Record<TransportMode, keyof typeof Ionicons.glyphMap> = {
  metro: 'subway',
  train: 'train',
  bus: 'bus',
  brt: 'bus',
  app: 'car',
  walk: 'walk',
};

/**
 * Mapa real da região (Apple Maps no iOS, Google Maps no Android) com
 * estádio, portões, estações e a posição do torcedor. Sugere o melhor
 * caminho e abre a rota real no app de mapas.
 */
export function ArrivalMap({ stadium }: { stadium: Stadium }) {
  const { colors, spacing, radius, scheme } = useTheme();
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
      mapRef.current?.fitToCoordinates([me, stadium.coords], { edgePadding: { top: 60, bottom: 60, left: 60, right: 60 }, animated: true });
    } catch {
      setDenied(true);
    } finally {
      setLocating(false);
    }
  };

  // Se a permissão já foi dada antes, localiza sozinho.
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
    <View style={{ gap: spacing.md }}>
      <View style={{ height: 300, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{ ...stadium.coords, latitudeDelta: 0.018, longitudeDelta: 0.018 }}
          showsUserLocation={!!user}
          showsPointsOfInterests={false}
          userInterfaceStyle={scheme}
          accessibilityLabel="Mapa da região do Maracanã"
        >
          <Marker coordinate={stadium.coords} title={stadium.name} description={stadium.address} pinColor={colors.primary} />
          {stadium.gates.map((g) => (
            <Marker key={g.id} coordinate={g.coords} title={g.label} description={g.access}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.onPrimary, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="label" tone="onPrimary" style={{ fontSize: 11, lineHeight: 13 }}>{g.id}</Text>
              </View>
            </Marker>
          ))}
          {stadium.transport.map((t) => (
            <Marker key={t.id} coordinate={t.coords} title={t.title} description={t.details}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceElevated, borderWidth: 1.5, borderColor: colors.info, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={TRANSPORT_ICON[t.mode]} size={16} color={colors.info} />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>
      <Text variant="footnote" tone="tertiary">Posições de portões e pontos são aproximadas. As rotas são calculadas pelo app de mapas.</Text>

      {suggestion ? (
        <Card variant="tinted">
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="navigate" size={18} color={colors.primaryText} />
              <Text variant="title" style={{ flex: 1 }}>Você está a {formatDistance(suggestion.toStadium)} do estádio</Text>
            </View>
            {suggestion.kind === 'walk' ? (
              <>
                <Text variant="callout" tone="secondary">Dá para ir a pé. Escolha o portão do seu setor e trace a rota.</Text>
                <Button label="Rota a pé até o estádio" icon="walk" onPress={() => openDirections({ query: stadium.mapsQuery, label: stadium.name }, 'walking')} fullWidth />
              </>
            ) : (
              <>
                <Text variant="callout" tone="secondary">
                  Sugestão: vá até <Text variant="bodyStrong">{suggestion.point.title}</Text> e entre pelo Portão {suggestion.point.bestGateIds.join(' ou ')} (~{suggestion.point.walkMinutes} min a pé da estação).
                </Text>
                <Button
                  label="Traçar rota"
                  icon="map"
                  onPress={() => openDirections({ query: suggestion.point.mapsQuery, label: suggestion.point.title }, travelModeFor(suggestion.point.mode))}
                  fullWidth
                />
              </>
            )}
          </View>
        </Card>
      ) : (
        <Card>
          <View style={{ gap: spacing.sm }}>
            <Text variant="title">Qual o melhor caminho para você?</Text>
            <Text variant="callout" tone="secondary">
              {denied ? 'Sem acesso à localização. Você pode liberar nos ajustes do celular ou escolher um ponto abaixo.' : 'Use sua localização para ver a estação e o portão mais indicados.'}
            </Text>
            <Button label="Usar minha localização" icon="locate" loading={locating} onPress={locate} fullWidth />
          </View>
        </Card>
      )}
    </View>
  );
}
