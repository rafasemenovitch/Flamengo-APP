import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/design-system';
import { AssistantScreen } from '@/features/assistant/AssistantScreen';
import { FlaTVScreen, NewsListScreen } from '@/features/content/ContentListScreens';
import { NewsDetailScreen } from '@/features/content/NewsDetailScreen';
import { NotificationsScreen } from '@/features/content/NotificationsScreen';
import { VideoDetailScreen } from '@/features/content/VideoDetailScreen';
import { MatchDetailScreen } from '@/features/matches/MatchDetailScreen';
import { PlayerProfileScreen } from '@/features/matches/PlayerProfileScreen';
import { StandingsScreen } from '@/features/matches/StandingsScreen';
import { CartScreen } from '@/features/nation/store/CartScreen';
import { CheckoutResultScreen } from '@/features/nation/store/CheckoutResultScreen';
import { CommunityScreen } from '@/features/nation/CommunityScreen';
import { GamificationScreen } from '@/features/nation/gamification/GamificationScreen';
import { MembershipScreen } from '@/features/nation/MembershipScreen';
import { PassportScreen } from '@/features/nation/gamification/PassportScreen';
import { ProductScreen } from '@/features/nation/store/ProductScreen';
import { RankingsScreen } from '@/features/nation/gamification/RankingsScreen';
import { StoreScreen } from '@/features/nation/store/StoreScreen';
import { SettingsScreen } from '@/features/profile/SettingsScreen';
import { StadiumModeScreen } from '@/features/stadium/StadiumModeScreen';
import { FaceEnrollmentScreen } from '@/features/tickets/FaceEnrollmentScreen';
import { TicketDetailScreen } from '@/features/tickets/TicketDetailScreen';
import { TicketPurchaseScreen } from '@/features/tickets/TicketPurchaseScreen';
import { TicketWalletScreen } from '@/features/tickets/TicketWalletScreen';
import { navigationRef } from './navigationRef';
import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();

  const navTheme = useMemo<NavTheme>(() => {
    const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primaryText,
        background: theme.colors.background,
        card: theme.colors.surfaceElevated,
        text: theme.colors.textPrimary,
        border: theme.colors.border,
        notification: theme.colors.primary,
      },
    };
  }, [theme]);

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: reduceMotion ? 'fade' : 'default',
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
        <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} />
        <Stack.Screen name="Standings" component={StandingsScreen} />
        <Stack.Screen name="News" component={NewsListScreen} />
        <Stack.Screen name="FlaTV" component={FlaTVScreen} />
        <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
        <Stack.Screen name="VideoDetail" component={VideoDetailScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="TicketPurchase" component={TicketPurchaseScreen} />
        <Stack.Screen name="TicketWallet" component={TicketWalletScreen} />
        <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
        <Stack.Screen
          name="FaceEnrollment"
          component={FaceEnrollmentScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="StadiumMode" component={StadiumModeScreen} />
        <Stack.Screen name="Store" component={StoreScreen} />
        <Stack.Screen name="Product" component={ProductScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen
          name="CheckoutResult"
          component={CheckoutResultScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="Membership" component={MembershipScreen} />
        <Stack.Screen name="Gamification" component={GamificationScreen} />
        <Stack.Screen name="Rankings" component={RankingsScreen} />
        <Stack.Screen name="Passport" component={PassportScreen} />
        <Stack.Screen name="Community" component={CommunityScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen
          name="Assistant"
          component={AssistantScreen}
          options={{ presentation: 'modal', animation: reduceMotion ? 'fade' : 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
