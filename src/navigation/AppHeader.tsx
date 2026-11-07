import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brandAssets } from '@assets/brand';
import { ClubCrest, Text, useTheme } from '@/design-system';
import { useAppState } from '@/state/AppStateProvider';

const HEADER_HEIGHT = 52;
/** Proporção do logo horizontal recortado (1200 × 170). */
const WORDMARK_RATIO = 1200 / 170;

/**
 * Cabeçalho FIXO das abas principais: logo "Flamengo App" à esquerda e o sino
 * de notificações (ponto vermelho quando há novidade) à direita.
 */
export function AppHeader() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, layout } = useTheme();
  const { unreadNotifications } = useAppState();
  const logoHeight = 22;

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: colors.bgCanvas,
        borderBottomWidth: 1,
        borderColor: colors.lineHairline,
      }}
    >
      <View
        style={{
          height: HEADER_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: layout.gutter,
          paddingRight: 8,
        }}
      >
        <View style={{ flex: 1 }} accessible accessibilityRole="header" accessibilityLabel="Flamengo App">
          {brandAssets.wordmark ? (
            <Image
              source={brandAssets.wordmark}
              style={{ height: logoHeight, width: logoHeight * WORDMARK_RATIO }}
              resizeMode="contain"
            />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ClubCrest size={24} />
              <Text variant="titleM">Flamengo App</Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => navigation.navigate('Notifications')}
          accessibilityRole="button"
          accessibilityLabel={
            unreadNotifications ? `Notificações, ${unreadNotifications} novas` : 'Notificações'
          }
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.inkPrimary} />
          {unreadNotifications > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 10,
                right: 11,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.accent,
              }}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}
