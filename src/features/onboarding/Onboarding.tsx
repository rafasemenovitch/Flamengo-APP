import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, Mascot, Monogram, palette, Text, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { NotificationPrefs } from '@/types/fan';
import { haptic } from '@/utils/haptics';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { FeaturePresentation } from '@/features/guidance/FeaturePresentation';
import { FEATURE_PRESENTATION } from '@/features/guidance/content';

const KEY = '@flamengo/onboarding-done';
const RESOURCE_START = 3;
const ALERTS_PAGE = RESOURCE_START + FEATURE_PRESENTATION.length;
const PAGES = ALERTS_PAGE + 1;

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

const ALERTS: [keyof NotificationPrefs, string, keyof typeof Ionicons.glyphMap][] = [
  ['goals', 'Gols', 'football'],
  ['matchStart', 'Início de jogo', 'play-circle'],
  ['matchEnd', 'Fim de jogo', 'flag'],
  ['lineups', 'Escalação', 'people'],
  ['tickets', 'Venda de ingressos', 'ticket'],
];

function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const { colors, spacing, layout, radius } = useTheme();
  const { profile, updateProfile, toggleFavoritePlayer } = useAppState();
  const squad = useAsync(() => services.matches.getSquad());
  const [page, setPage] = useState(0);

  const go = (p: number) => {
    haptic.select();
    setPage(p);
  };

  const favs = profile?.favoritePlayerIds ?? [];

  if (page >= RESOURCE_START && page < ALERTS_PAGE) {
    return (
      <FeaturePresentation
        onClose={() => go(ALERTS_PAGE)}
        onBack={() => go(RESOURCE_START - 1)}
        flow={{
          page: page - RESOURCE_START,
          onPageChange: (index) => setPage(RESOURCE_START + index),
          stepOffset: RESOURCE_START,
          totalSteps: PAGES,
        }}
      />
    );
  }

  if (page === 1) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
        <AuthScreen onContinue={() => go(2)} onBack={() => go(0)} />
      </SafeAreaView>
    );
  }

  return (
    // Boas-vindas em vermelho chapado; demais passos em preto (sempre escuro, texto branco legível).
    <View style={{ flex: 1, backgroundColor: page === 0 ? colors.bgRed : palette.ink950 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: layout.gutter,
            minHeight: 44,
          }}
        >
          {page < PAGES - 1 && (
            <Pressable
              onPress={page === 0 ? () => go(1) : onDone}
              accessibilityRole="button"
              style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm }}
            >
              <Text variant="label" tone="onMedia" style={{ opacity: 0.85 }}>
                Pular
              </Text>
            </Pressable>
          )}
        </View>

        <View style={{ flex: 1 }}>
          {/* 1 — Boas-vindas */}
          {page === 0 && (
            <View
              style={{
                flex: 1,
                paddingHorizontal: layout.gutter * 1.5,
                justifyContent: 'center',
                gap: spacing.xl,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <Monogram color="white" width={76} />
                <Mascot pose="fan-welcome" size={120} />
              </View>
              <View style={{ gap: spacing.sm }}>
                <Text variant="displayL" tone="onMedia" style={{ fontSize: 48, lineHeight: 48 }}>
                  Bem-vindo à Nação
                </Text>
                <Text variant="body" tone="onMedia" style={{ opacity: 0.85 }}>
                  Jogos ao vivo, ingressos, o seu dia no Maracanã, sócio-torcedor, loja e a maior torcida do
                  Brasil num só lugar.
                </Text>
              </View>
              <View style={{ gap: spacing.md }}>
                {[
                  ['pulse', 'Placar e lance a lance ao vivo'],
                  ['ticket', 'Ingresso na carteira e Modo Maracanã'],
                  ['trophy', 'Pontos, medalhas e rankings da torcida'],
                ].map(([icon, label]) => (
                  <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name={icon as keyof typeof Ionicons.glyphMap}
                        size={18}
                        color={palette.white}
                      />
                    </View>
                    <Text variant="bodyStrong" tone="onMedia">
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 3 — Ídolos (depois do login ou da entrada como visitante). */}
          {page === 2 && (
            <View
              style={{ flex: 1, paddingHorizontal: layout.gutter, paddingTop: spacing.xl, gap: spacing.lg }}
            >
              <View style={{ gap: spacing.xs, paddingHorizontal: layout.gutter / 2 }}>
                <Text variant="h1" tone="onMedia">
                  Quem são seus ídolos?
                </Text>
                <Text variant="callout" tone="onMedia" style={{ opacity: 0.85 }}>
                  A gente personaliza notícias e vídeos para você.
                </Text>
              </View>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: spacing.md,
                  justifyContent: 'center',
                  paddingBottom: spacing.xl,
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
                      accessibilityLabel={`${p.shortName}, ${p.role}`}
                      style={{
                        width: 96,
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: spacing.sm,
                        borderRadius: radius.lg,
                        backgroundColor: on ? colors.primarySubtle : colors.surface,
                        borderWidth: 1.5,
                        borderColor: on ? colors.primary : colors.border,
                      }}
                    >
                      <View>
                        <Avatar name={p.shortName} number={p.number} size={52} />
                        {on && (
                          <View
                            style={{
                              position: 'absolute',
                              right: -4,
                              top: -4,
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: colors.primary,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                          </View>
                        )}
                      </View>
                      <Text variant="label" numberOfLines={1} align="center" style={{ fontSize: 12 }}>
                        {p.shortName}
                      </Text>
                      <Text variant="footnote" tone="tertiary" numberOfLines={1}>
                        {p.position}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Alertas, depois da apresentação dos recursos. */}
          {page === ALERTS_PAGE && (
            <View
              style={{ flex: 1, paddingHorizontal: layout.gutter, paddingTop: spacing.xl, gap: spacing.lg }}
            >
              <View style={{ gap: spacing.xs, paddingHorizontal: layout.gutter / 2 }}>
                <Text variant="h1" tone="onMedia">
                  Não perca nenhum gol
                </Text>
                <Text variant="callout" tone="onMedia" style={{ opacity: 0.85 }}>
                  Escolha o que você quer receber. Dá para mudar depois no perfil.
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {profile &&
                  ALERTS.map(([k, label, icon], i) => (
                    <View
                      key={k}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        padding: spacing.lg,
                        borderTopWidth: i ? StyleSheet.hairlineWidth : 0,
                        borderColor: colors.border,
                      }}
                    >
                      <Ionicons name={icon} size={20} color={colors.primaryText} />
                      <Text variant="bodyStrong" style={{ flex: 1 }}>
                        {label}
                      </Text>
                      <Switch
                        value={profile.notifications[k]}
                        onValueChange={(v) =>
                          updateProfile({ notifications: { ...profile.notifications, [k]: v } })
                        }
                        accessibilityLabel={label}
                        trackColor={{ true: colors.primary, false: colors.surfaceMuted }}
                        thumbColor={colors.onPrimary}
                        ios_backgroundColor={colors.surfaceMuted}
                      />
                    </View>
                  ))}
              </View>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: layout.gutter, paddingBottom: spacing.lg, gap: spacing.lg }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}
            accessibilityLabel={`Passo ${page + 1} de ${PAGES}`}
          >
            {Array.from({ length: PAGES }, (_, i) => (
              <View
                key={i}
                style={{
                  height: 6,
                  width: i === page ? 22 : 6,
                  borderRadius: 3,
                  backgroundColor: i === page ? colors.primary : colors.borderStrong,
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {page > 0 && <Button label="Voltar" variant="secondary" onPress={() => go(page - 1)} />}
            <Button
              label={
                page === 0
                  ? 'Começar'
                  : page === 2
                    ? favs.length
                      ? `Continuar (${favs.length})`
                      : 'Continuar'
                    : 'Entrar no app'
              }
              icon={page === PAGES - 1 ? 'checkmark' : 'arrow-forward'}
              iconPosition="right"
              onPress={() => {
                if (page < PAGES - 1) go(page + 1);
                else {
                  haptic.success();
                  onDone();
                }
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
