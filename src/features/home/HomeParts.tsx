import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, LiveIndicator, Mascot, Text, useTheme } from '@/design-system';
import { DEMO_SCENARIOS, IS_DEMO, type DemoScenario } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { MatchDetail } from '@/types/match';
import type { MatchDayPlan } from '@/types/stadium';
import { formatNumber, shiftTime } from '@/utils/format';
import { haptic } from '@/utils/haptics';

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/** Saudação (especificação 13.1.1): sem pílula; sino de 24px com ponto vermelho. */
export function HomeHeader({
  unread,
  matchday,
  onSecretLongPress,
}: {
  unread: number;
  matchday: boolean;
  onSecretLongPress?: () => void;
}) {
  const navigation = useNavigation();
  const { profile, progress } = useAppState();
  const { colors, layout } = useTheme();
  const name = profile?.firstName ?? 'torcedor';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: layout.gutter,
        paddingTop: 16,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        {/* Toque longo no nome = controles da demonstração (sem pista visual). */}
        <Pressable
          onLongPress={() => {
            haptic.medium();
            onSecretLongPress?.();
          }}
          delayLongPress={600}
          accessible={false}
        >
          <Text variant="bodyL" tone="secondary">
            {matchday ? 'Dia de Mengão,' : `${greeting()},`}
          </Text>
          <Text variant="displayL" numberOfLines={1}>
            {name}
          </Text>
        </Pressable>
        {progress && (
          <Pressable
            onPress={() => navigation.navigate('Gamification')}
            accessibilityRole="button"
            style={{ flexDirection: 'row', marginTop: 4, minHeight: 24 }}
          >
            <Text variant="labelM" tone="brand">
              Nível {progress.level.level} · {progress.level.name}
            </Text>
            <Text variant="labelM" tone="secondary">
              {' '}
              · {formatNumber(progress.points)} pts
            </Text>
          </Pressable>
        )}
      </View>
      <Pressable
        onPress={() => navigation.navigate('Notifications')}
        accessibilityRole="button"
        accessibilityLabel={unread ? `Notificações, ${unread} novas` : 'Notificações'}
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="notifications-outline" size={24} color={colors.inkPrimary} />
        {unread > 0 && (
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
  );
}

const SCENARIO_HINT: Record<DemoScenario, string> = {
  upcoming: 'Próximo jogo daqui a 2 dias, com contagem regressiva e venda aberta',
  matchday: 'Jogo hoje: banner e atalho do Modo Maracanã aparecem',
  live: "Ao vivo a partir dos 67'. O relógio anda e o 3º gol sai aos 83'",
  finished: 'Fim de jogo: resultado, melhores momentos e craque do jogo',
};

/** Painel escondido de demonstração (bottom sheet). Toque longo no nome da Home. */
export function DemoControlsSheet({
  visible,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  value: DemoScenario;
  onChange: (s: DemoScenario) => void;
  onClose: () => void;
}) {
  const { colors, radius, layout } = useTheme();
  if (!IS_DEMO) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
        onPress={onClose}
        accessible={false}
      >
        <Pressable onPress={() => undefined} accessible={false}>
          <SafeAreaView
            edges={['bottom']}
            style={{
              backgroundColor: colors.bgRaised,
              borderTopLeftRadius: radius.l,
              borderTopRightRadius: radius.l,
              padding: layout.gutter,
              gap: 12,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.lineHairline,
              }}
            />
            <Text variant="titleL">Momento do jogo</Text>
            <Text variant="bodyS" tone="secondary">
              Controle da demonstração. Visível só para quem apresenta.
            </Text>
            {DEMO_SCENARIOS.map((s) => {
              const active = s.key === value;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => {
                    haptic.select();
                    onChange(s.key);
                    onClose();
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    minHeight: 56,
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderColor: colors.lineHairline,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={active ? colors.accentText : colors.inkTertiary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="titleS">{s.label}</Text>
                    <Text variant="bodyS" tone="secondary">
                      {SCENARIO_HINT[s.key]}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type Shortcut = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  live?: boolean;
};

/**
 * Atalhos (especificação 12.7): 4 colunas iguais sem tiles, separadas por
 * hairlines verticais. Maracanã ganha ponto ao vivo em dia de jogo.
 */
export function QuickActions({ matchday }: { matchday: boolean }) {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  // Ordem pedida: Maracanã (sempre, com ponto ao vivo em dia de jogo), Sócio, Loja, FlaTV.
  const items: Shortcut[] = [
    {
      key: 'maraca',
      label: 'Maracanã',
      icon: 'location-outline',
      onPress: () => navigation.navigate('StadiumMode'),
      live: matchday,
    },
    { key: 'socio', label: 'Sócio', icon: 'card-outline', onPress: () => navigation.navigate('Membership') },
    { key: 'loja', label: 'Loja', icon: 'bag-handle-outline', onPress: () => navigation.navigate('Store') },
    {
      key: 'flatv',
      label: 'FlaTV',
      icon: 'play-circle-outline',
      onPress: () => navigation.navigate('FlaTV'),
    },
  ];
  return (
    <View style={{ flexDirection: 'row', marginHorizontal: layout.gutter }}>
      {items.map((it, i) => (
        <Pressable
          key={it.key}
          onPress={it.onPress}
          accessibilityRole="button"
          accessibilityLabel={it.label}
          style={({ pressed }) => ({
            flex: 1,
            height: 76,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderLeftWidth: i ? 1 : 0,
            borderColor: colors.lineHairline,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <View>
            <Ionicons name={it.icon} size={28} color={it.live ? colors.accentText : colors.inkPrimary} />
            {it.live && (
              <View style={{ position: 'absolute', top: -2, right: -6 }}>
                <LiveIndicator compact size={6} />
              </View>
            )}
          </View>
          <Text variant="labelM" tone={it.live ? 'brand' : 'secondary'} numberOfLines={1}>
            {it.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Banner de dia de jogo (13.1.4): bloco vermelho em sangria, mascote cortado pela base. */
export function MatchdayBanner({ match, plan }: { match: MatchDetail; plan?: MatchDayPlan }) {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  if (!plan) return null;
  const arrival = shiftTime(match.kickoff, Number(plan.recommendedArrival));
  const queue = plan.queues.find((q) => q.gateId === plan.recommendedGateId);
  return (
    <View
      style={{ backgroundColor: colors.bgRed, padding: layout.gutter, overflow: 'hidden', minHeight: 140 }}
    >
      <View style={{ position: 'absolute', right: 8, bottom: -24 }}>
        <Mascot pose="fan-arrived" size={96} />
      </View>
      <View style={{ gap: 8, paddingRight: 96 }}>
        <Text variant="titleL" tone="onPrimary">
          Seu jogo é hoje
        </Text>
        <Text variant="bodyM" tone="onPrimary" style={{ opacity: 0.85 }}>
          Portão {plan.recommendedGateId} · chegue às {arrival}
          {queue ? ` · fila ~${queue.waitMinutes} min` : ''}
        </Text>
        <Button
          label="Abrir Modo Maracanã"
          variant="light"
          size="sm"
          onPress={() => navigation.navigate('StadiumMode')}
          style={{ marginTop: 4 }}
        />
      </View>
    </View>
  );
}
