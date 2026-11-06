import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AlertHost, ClubCrest, fontFiles, palette, ThemeProvider, useTheme } from '@/design-system';
import { RootNavigator } from '@/navigation/RootNavigator';
import { OnboardingGate } from '@/features/onboarding/Onboarding';
import { AppStateProvider } from '@/state/AppStateProvider';

function ThemedApp() {
  const { scheme } = useTheme();
  return (
    <AlertHost>
      <AppStateProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <OnboardingGate>
          <RootNavigator />
        </OnboardingGate>
      </AppStateProvider>
    </AlertHost>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontFiles);

  if (!fontsLoaded && !fontError) {
    // Splash mínimo enquanto as fontes carregam (fundo do tema escuro padrão).
    return (
      <View style={{ flex: 1, backgroundColor: palette.ink950, alignItems: 'center', justifyContent: 'center' }}>
        <ThemeProvider>
          <ClubCrest size={72} />
        </ThemeProvider>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
