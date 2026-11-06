import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, ClubCrest, palette, Text, useTheme, withAlpha } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { NotificationPrefs } from '@/types/fan';
import { haptic } from '@/utils/haptics';

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

  if (state === 'loading') return null;
  return <Ctx.Provider value={value}>{state === 'show' ? <OnboardingFlow onDone={finish} /> : children}</Ctx.Provider>;
}

const ALERTS: Array<[keyof NotificationPrefs, string, keyof typeof Ionicons.glyphMap]> = [
  ['goals', 'Gols', 'football'],
  ['matchStart', 'Início de jogo', 'play-circle'],
  ['matchEnd', 'Fim de jogo', 'flag'],
  ['lineups', 'Escalação', 'people'],
  ['tickets', 'Venda de ingressos', 'ticket'],
];

function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const { width } = useWindowDimensions();
  const { colors, spacing, layout, radius } = useTheme();
  const { profile, updateProfile, toggleFavoritePlayer } = useAppState();
  const squad = useAsync(() => services.matches.getSquad());
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const [page, setPage] = useState(0);
  const PAGES = 3;

  const go = (p: number) => {
    haptic.select();
    scroller.current?.scrollTo({ x: p * width, animated: true });
    setPage(p);
  };

  const favs = profile?.favoritePlayerIds ?? [];

  return (
    // Fundo sempre escuro (texto branco legível também no tema claro).
    <View style={{ flex: 1, backgroundColor: palette.ink950 }}>
      <LinearGradient colors={[palette.red800, palette.ink950]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.55 }} />
      {/* Listras diagonais sutis */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: 0.06 }]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={{ position: 'absolute', top: -80 + i * 90, left: -100, right: -100, height: 34, backgroundColor: palette.white, transform: [{ rotate: '-14deg' }] }} />
        ))}
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: layout.gutter, minHeight: 44 }}>
          {page < PAGES - 1 && (
            <Pressable onPress={onDone} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm }}>
              <Text variant="label" tone="onMedia" style={{ opacity: 0.85 }}>Pular</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {/* 1 — Boas-vindas */}
          <View style={{ width, paddingHorizontal: layout.gutter * 1.5, justifyContent: 'center', gap: spacing.xl }}>
            <ClubCrest size={96} />
            <View style={{ gap: spacing.sm }}>
              <Text variant="display" tone="onMedia" style={{ fontSize: 44, lineHeight: 46 }}>Bem-vindo à Nação</Text>
              <Text variant="body" tone="onMedia" style={{ opacity: 0.85 }}>
                Jogos ao vivo, ingressos, o seu dia no Maracanã, sócio-torcedor, loja e a maior torcida do Brasil num só lugar.
              </Text>
            </View>
            <View style={{ gap: spacing.md }}>
              {[
                ['pulse', 'Placar e lance a lance ao vivo'],
                ['ticket', 'Ingresso na carteira e Modo Maracanã'],
                ['trophy', 'Pontos, medalhas e rankings da torcida'],
              ].map(([icon, label]) => (
                <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: withAlpha(palette.white, 0.12), alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={palette.white} />
                  </View>
                  <Text variant="bodyStrong" tone="onMedia">{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 2 — Ídolos */}
          <View style={{ width, paddingHorizontal: layout.gutter, paddingTop: spacing.xl, gap: spacing.lg }}>
            <View style={{ gap: spacing.xs, paddingHorizontal: layout.gutter / 2 }}>
              <Text variant="h1" tone="onMedia">Quem são seus ídolos?</Text>
              <Text variant="callout" tone="onMedia" style={{ opacity: 0.85 }}>A gente personaliza notícias e vídeos para você.</Text>
            </View>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center', paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
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
                    style={{ width: 96, alignItems: 'center', gap: 6, paddingVertical: spacing.sm, borderRadius: radius.lg, backgroundColor: on ? colors.primarySubtle : colors.surface, borderWidth: 1.5, borderColor: on ? colors.primary : colors.border }}
                  >
                    <View>
                      <Avatar name={p.shortName} number={p.number} size={52} />
                      {on && (
                        <View style={{ position: 'absolute', right: -4, top: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                        </View>
                      )}
                    </View>
                    <Text variant="label" numberOfLines={1} align="center" style={{ fontSize: 12 }}>{p.shortName}</Text>
                    <Text variant="footnote" tone="tertiary" numberOfLines={1}>{p.position}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* 3 — Alertas */}
          <View style={{ width, paddingHorizontal: layout.gutter, paddingTop: spacing.xl, gap: spacing.lg }}>
            <View style={{ gap: spacing.xs, paddingHorizontal: layout.gutter / 2 }}>
              <Text variant="h1" tone="onMedia">Não perca nenhum gol</Text>
              <Text variant="callout" tone="onMedia" style={{ opacity: 0.85 }}>Escolha o que você quer receber. Dá para mudar depois no perfil.</Text>
            </View>
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
              {profile &&
                ALERTS.map(([k, label, icon], i) => (
                  <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderColor: colors.border }}>
                    <Ionicons name={icon} size={20} color={colors.primaryText} />
                    <Text variant="bodyStrong" style={{ flex: 1 }}>{label}</Text>
                    <Switch
                      value={profile.notifications[k]}
                      onValueChange={(v) => updateProfile({ notifications: { ...profile.notifications, [k]: v } })}
                      accessibilityLabel={label}
                      trackColor={{ true: colors.primary, false: colors.surfaceMuted }}
                      thumbColor={colors.onPrimary}
                      ios_backgroundColor={colors.surfaceMuted}
                    />
                  </View>
                ))}
            </View>
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: layout.gutter, paddingBottom: spacing.lg, gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }} accessibilityLabel={`Passo ${page + 1} de ${PAGES}`}>
            {Array.from({ length: PAGES }, (_, i) => (
              <View key={i} style={{ height: 6, width: i === page ? 22 : 6, borderRadius: 3, backgroundColor: i === page ? colors.primary : colors.borderStrong }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {page > 0 && <Button label="Voltar" variant="secondary" onPress={() => go(page - 1)} />}
            <Button
              label={page === 0 ? 'Começar' : page === 1 ? (favs.length ? `Continuar (${favs.length})` : 'Continuar') : 'Entrar no app'}
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
