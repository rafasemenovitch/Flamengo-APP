import { Ionicons } from '@expo/vector-icons';
import { BottomTabBar, createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { fonts, useTheme } from '@/design-system';
import { HomeScreen } from '@/features/home/HomeScreen';
import { MatchesScreen } from '@/features/matches/MatchesScreen';
import { NationScreen } from '@/features/nation/NationScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { TicketsScreen } from '@/features/tickets/TicketsScreen';
import { AssistantFab } from './AssistantFab';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const TABS: Array<{
  name: keyof TabParamList;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}> = [
  { name: 'Inicio', title: 'Início', icon: 'home-outline', iconActive: 'home' },
  { name: 'Jogos', title: 'Jogos', icon: 'football-outline', iconActive: 'football' },
  { name: 'Ingressos', title: 'Ingressos', icon: 'ticket-outline', iconActive: 'ticket' },
  { name: 'Nacao', title: 'Nação', icon: 'people-outline', iconActive: 'people' },
  { name: 'Perfil', title: 'Perfil', icon: 'person-circle-outline', iconActive: 'person-circle' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const [barHeight, setBarHeight] = useState(0);
  return (
    <View style={styles.flex}>
    <Tab.Navigator
      tabBar={(props) => <MeasuredTabBar {...props} onHeight={setBarHeight} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.onPrimary },
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
            tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? t.iconActive : t.icon} color={color} size={size} />,
          }}
        />
      ))}
    </Tab.Navigator>
      {/* Irmão do navigator (não filho da tab bar): no Android, filhos fora dos
          limites do pai não recebem toque. */}
      {barHeight > 0 && <AssistantFab bottom={barHeight + spacing.md} onPress={() => navigation.navigate('Assistant')} />}
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
