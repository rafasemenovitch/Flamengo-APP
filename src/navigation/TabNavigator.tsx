import { Ionicons } from '@expo/vector-icons';
import {
  BottomTabBar,
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FabVisibilityProvider, Text, useFabVisibility, useTheme } from '@/design-system';
import { HomeScreen } from '@/features/home/HomeScreen';
import { MatchesScreen } from '@/features/matches/MatchesScreen';
import { NationScreen } from '@/features/nation/NationScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { TicketsScreen } from '@/features/tickets/TicketsScreen';
import { AssistantFab } from './AssistantFab';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const TABS: {
  name: keyof TabParamList;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  // Ícones de linha sempre (sem preenchido no ativo): o ativo muda de cor e ganha o ponto vermelho.
  { name: 'Inicio', title: 'Início', icon: 'home-outline', iconActive: 'home-outline' },
  { name: 'Jogos', title: 'Jogos', icon: 'football-outline', iconActive: 'football-outline' },
  { name: 'Ingressos', title: 'Ingressos', icon: 'ticket-outline', iconActive: 'ticket-outline' },
  { name: 'Nacao', title: 'Nação', icon: 'people-outline', iconActive: 'people-outline' },
  { name: 'Perfil', title: 'Perfil', icon: 'person-outline', iconActive: 'person-outline' },
];

const SCREENS: Record<keyof TabParamList, React.ComponentType<any>> = {
  Inicio: HomeScreen,
  Jogos: MatchesScreen,
  Ingressos: TicketsScreen,
  Nacao: NationScreen,
  Perfil: ProfileScreen,
};

/** Tab bar padrão que informa a própria altura (para posicionar o FAB acima dela). */
function MeasuredTabBar({ onHeight, ...props }: BottomTabBarProps & { onHeight: (h: number) => void }) {
  return (
    <View onLayout={(e) => onHeight(e.nativeEvent.layout.height)}>
      <BottomTabBar {...props} />
    </View>
  );
}

export function TabNavigator() {
  return (
    <FabVisibilityProvider>
      <TabNavigatorInner />
    </FabVisibilityProvider>
  );
}

function TabNavigatorInner() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const fab = useFabVisibility();
  const [barHeight, setBarHeight] = useState(0);
  return (
    <View style={styles.flex}>
      <Tab.Navigator
        tabBar={(props) => <MeasuredTabBar {...props} onHeight={setBarHeight} />}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accentText,
          tabBarInactiveTintColor: colors.inkTertiary,
          tabBarStyle: {
            backgroundColor: colors.bgCanvas,
            borderTopColor: colors.lineHairline,
            borderTopWidth: 1,
            minHeight: 60,
          },
          tabBarItemStyle: { paddingTop: 6 },
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.inkOnRed },
          animation: 'shift',
        }}
      >
        {TABS.map((t) => (
          <Tab.Screen
            key={t.name}
            name={t.name}
            component={SCREENS[t.name]}
            options={{
              title: t.title,
              tabBarAccessibilityLabel: t.title,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? t.iconActive : t.icon} color={color} size={24} />
              ),
              // Rótulo + ponto vermelho de 4px na aba ativa (assinatura 7.2).
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Text variant="labelTab" style={{ color }}>
                    {t.title}
                  </Text>
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: focused ? colors.accent : 'transparent',
                    }}
                  />
                </View>
              ),
            }}
          />
        ))}
      </Tab.Navigator>
      {/* Irmão do navigator (não filho da tab bar): no Android, filhos fora dos
          limites do pai não recebem toque. */}
      {barHeight > 0 && (
        <AssistantFab
          bottom={barHeight + spacing.lg}
          visible={fab?.visible ?? true}
          onPress={() => navigation.navigate('Assistant')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
