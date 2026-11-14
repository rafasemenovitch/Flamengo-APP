import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, IconButton, TabHeader, Text, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { NotificationPrefs } from '@/types/fan';
import { haptic } from '@/utils/haptics';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { WelcomeCarousel } from './WelcomeCarousel';

const KEY = '@flamengo/onboarding-done';

interface OnboardingCtx {
  /** Mostra o onboarding de novo (útil para repetir a apresentação). */
  replay: () => void;
}
const Ctx = createContext<OnboardingCtx>({ replay: () => undefined });
export const useOnboarding = () => useContext(Ctx);

/** Mostra o onboarding na primeira abertura; depois, o app normal. */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'show' | 'done'>('loading');
  const { ready, session, isGuest, accountProfile, registering } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setState(v ? 'done' : 'show'))
      .catch(() => setState('show'));
  }, []);

  const finish = useCallback(() => {
    AsyncStorage.setItem(KEY, '1').catch(() => undefined);
    setState('done');
  }, []);
  const value = useMemo(() => ({ replay: () => setState('show') }), []);

  if (state === 'loading' || !ready) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bgCanvas, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator color={colors.accentText} accessibilityLabel="Carregando" />
      </View>
    );
  }
  return (
    <Ctx.Provider value={value}>
      {state === 'show' ? (
        <OnboardingFlow onDone={finish} />
      ) : (session && accountProfile && !registering) || isGuest ? (
        children
      ) : (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
          <AuthScreen onContinue={() => undefined} />
        </SafeAreaView>
      )}
    </Ctx.Provider>
  );
}

const ALERTS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: 'goals', label: 'Gols', hint: 'Na hora, com o placar' },
  { key: 'matchStart', label: 'Início de jogo', hint: 'Quando a bola rolar' },
  { key: 'matchEnd', label: 'Fim de jogo', hint: 'Resultado e melhores momentos' },
  { key: 'lineups', label: 'Escalação', hint: 'Uma hora antes do jogo' },
  { key: 'tickets', label: 'Venda de ingressos', hint: 'Quando abrir a venda' },
];

/** Passos depois do carrossel: conta, ídolos e alertas. */
const STEPS = 3;

/**
 * Boas-vindas: carrossel das áreas do app (desliza e passa sozinho) → conta ou visitante →
 * ídolos → alertas. Ídolos e alertas usam o cabeçalho das abas e listas com fio fino.
 */
function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const { colors, layout } = useTheme();
  const { enterAsGuest } = useAuth();
  const { profile, updateProfile, toggleFavoritePlayer } = useAppState();
  const squad = useAsync(() => services.matches.getSquad());
  const [page, setPage] = useState(0);
  const go = (p: number) => {
    haptic.select();
    setPage(p);
  };
  const favs = profile?.favoritePlayerIds ?? [];

  if (page === 0)
    return (
      <WelcomeCarousel
        onStart={() => go(1)}
        onGuest={async () => {
          haptic.select();
          await enterAsGuest();
          setPage(2);
        }}
      />
    );

  if (page === 1)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
        <AuthScreen onContinue={() => go(2)} onBack={() => go(0)} />
      </SafeAreaView>
    );

  const step = page - 1; // 1 = ídolos, 2 = alertas
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
        }}
      >
        <IconButton
          icon="chevron-back"
          variant="plain"
          accessibilityLabel="Voltar"
          onPress={() => go(page === 2 ? 0 : page - 1)}
        />
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="Pular e entrar no app"
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}
        >
          <Text variant="labelM" tone="secondary">
            Pular
          </Text>
        </Pressable>
      </View>

      {page === 2 && (
        <View style={{ flex: 1 }}>
          <TabHeader
            title="Seus ídolos"
            subtitle="Quem você mais acompanha aparece primeiro nas notícias e nos vídeos."
          />
          <ScrollView
            style={{ flex: 1, marginTop: 20 }}
            contentContainerStyle={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingHorizontal: layout.gutter - 4,
              paddingBottom: 24,
              rowGap: 18,
            }}
            showsVerticalScrollIndicator={false}
          >
            {squad.data?.map((p) => {
              const on = favs.includes(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    haptic.select();
                    toggleFavoritePlayer(p.id);
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${p.shortName}, ${p.position}`}
                  style={({ pressed }) => ({
                    width: '25%',
                    alignItems: 'center',
                    gap: 6,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      padding: 3,
                      borderRadius: 40,
                      borderWidth: 2,
                      borderColor: on ? colors.accent : 'transparent',
                    }}
                  >
                    <Avatar name={p.shortName} number={p.number} size={56} />
                  </View>
                  <Text
                    variant="labelM"
                    numberOfLines={1}
                    style={{ color: on ? colors.accentText : colors.inkPrimary }}
                  >
                    {p.shortName}
                  </Text>
                  <Text variant="bodyS" tone="tertiary" numberOfLines={1}>
                    {p.position}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {page === 3 && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          <TabHeader
            title="Não perca nenhum gol"
            subtitle="Escolha os avisos. Dá para mudar depois no perfil."
          />
          <View style={{ marginTop: 24, borderTopWidth: 1, borderColor: colors.lineHairline }}>
            {profile &&
              ALERTS.map((a) => (
                <View
                  key={a.key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    minHeight: 64,
                    paddingHorizontal: layout.gutter,
                    borderBottomWidth: 1,
                    borderColor: colors.lineHairline,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="titleS">{a.label}</Text>
                    <Text variant="bodyS" tone="secondary">
                      {a.hint}
                    </Text>
                  </View>
                  <Switch
                    value={profile.notifications[a.key]}
                    onValueChange={(v) =>
                      updateProfile({ notifications: { ...profile.notifications, [a.key]: v } })
                    }
                    accessibilityLabel={a.label}
                    trackColor={{ true: colors.accent, false: colors.bgRaised2 }}
                    thumbColor="#FFFFFF"
                    // Na web (react-native-web) a cor do botão ligado é outra propriedade.
                    {...({ activeThumbColor: '#FFFFFF' } as object)}
                    ios_backgroundColor={colors.bgRaised2}
                  />
                </View>
              ))}
          </View>
        </ScrollView>
      )}

      <View style={{ paddingHorizontal: layout.gutter, paddingTop: 12, paddingBottom: 12, gap: 16 }}>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Passo ${step + 1} de ${STEPS}`}
          style={{ flexDirection: 'row', gap: 6 }}
        >
          {Array.from({ length: STEPS }, (_, i) => (
            <View
              key={i}
              style={{
                height: 4,
                width: i === step ? 24 : 8,
                borderRadius: 2,
                backgroundColor: i <= step ? colors.accent : colors.lineHairline,
              }}
            />
          ))}
        </View>
        <Button
          label={page === 2 ? (favs.length ? `Continuar com ${favs.length}` : 'Continuar') : 'Entrar no app'}
          icon={page === 3 ? 'checkmark' : 'arrow-forward'}
          iconPosition="right"
          fullWidth
          onPress={() => {
            if (page === 2) go(3);
            else {
              haptic.success();
              onDone();
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}
