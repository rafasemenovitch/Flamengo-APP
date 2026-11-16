import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, LiveIndicator, Monogram, Text, useTheme } from '@/design-system';
import { useDemoMember } from '@/hooks/useMatch';
import { DEMO_SCENARIOS, IS_DEMO, type DemoScenario } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { FanProgress } from '@/types/gamification';
import type { MatchDetail } from '@/types/match';
import type { MatchDayPlan } from '@/types/stadium';
import { formatNumber, shiftTime } from '@/utils/format';
import { haptic } from '@/utils/haptics';
import { DemoLocationPicker } from '@/features/maracana/DemoLocationPicker';

function levelProgress(p: FanProgress) {
  if (!p.nextLevel) return 1;
  return (p.points - p.level.minPoints) / (p.nextLevel.minPoints - p.level.minPoints);
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/**
 * Saudação com a trilha: nome à esquerda; à direita, só o nome do nível e os pontos (menores
 * que o nome). Embaixo, a barra da trilha de ponta a ponta. Tudo do lado direito abre a trilha.
 */
export function HomeHeader({
  matchday,
  onSecretLongPress,
}: {
  unread?: number;
  matchday: boolean;
  onSecretLongPress?: () => void;
}) {
  const navigation = useNavigation();
  const { profile, progress } = useAppState();
  const { layout, colors } = useTheme();
  const name = profile?.firstName ?? 'torcedor';
  const openTrail = () => navigation.navigate('Trail');
  return (
    <View style={{ paddingHorizontal: layout.gutter, paddingTop: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}>
        {/* Toque longo no nome = controles da demonstração (sem pista visual). */}
        <Pressable
          style={{ flex: 1 }}
          onLongPress={() => {
            haptic.medium();
            onSecretLongPress?.();
          }}
          delayLongPress={600}
          accessible={false}
        >
          <Text variant="bodyM" tone="secondary">
            {matchday ? 'Dia de Mengão,' : `${greeting()},`}
          </Text>
          <Text variant="displayM" numberOfLines={1}>
            {name}
          </Text>
        </Pressable>
        {progress && (
          <Pressable
            onPress={openTrail}
            accessibilityRole="button"
            accessibilityLabel={`${progress.level.name}, ${formatNumber(progress.points)} pontos. Abrir a trilha da temporada`}
            style={({ pressed }) => ({ alignItems: 'flex-end', opacity: pressed ? 0.7 : 1 })}
          >
            <Text variant="titleS">
              {formatNumber(progress.points)}
              <Text variant="bodyS" tone="secondary">
                {' '}
                pts
              </Text>
            </Text>
            <Text variant="displayS" tone="brand">
              {progress.level.name}
            </Text>
          </Pressable>
        )}
      </View>
      {progress && (
        <Pressable onPress={openTrail} accessible={false} hitSlop={8}>
          <View style={{ height: 3, borderRadius: 2, overflow: 'hidden' }}>
            {/* Trilho claro o bastante para aparecer sobre o preto (e sobre o claro). */}
            <View
              style={{ position: 'absolute', inset: 0, backgroundColor: colors.inkTertiary, opacity: 0.45 }}
            />
            <View
              style={{
                height: '100%',
                width: `${Math.round(levelProgress(progress) * 100)}%`,
                backgroundColor: colors.accent,
              }}
            />
          </View>
        </Pressable>
      )}
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
            <MemberToggle />
            <View style={{ marginTop: 12 }}>
              <DemoLocationPicker />
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Na demonstração: ver o app como sócio ou como torcedor sem plano. */
function MemberToggle() {
  const { colors } = useTheme();
  const [isMember, setMember] = useDemoMember();
  return (
    <View style={{ marginTop: 12, gap: 8 }}>
      <Text variant="titleL">Torcedor</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(
          [
            [true, 'Sócio'],
            [false, 'Não sócio'],
          ] as const
        ).map(([v, label]) => {
          const on = v === isMember;
          return (
            <Pressable
              key={label}
              onPress={() => {
                haptic.select();
                setMember(v);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? colors.inkPrimary : 'transparent',
                borderWidth: on ? 0 : 1,
                borderColor: colors.lineHairline,
              }}
            >
              <Text variant="labelM" style={{ color: on ? colors.bgCanvas : colors.inkSecondary }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  // Ordem pedida: Maracanã (sempre, com ponto ao vivo em dia de jogo), Sócio, Loja, Mídia (notícias + FlaTV).
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
      key: 'midia',
      label: 'Mídia',
      icon: 'newspaper-outline',
      onPress: () => navigation.navigate('News'),
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

/**
 * Convite para a Nação (não interativo): bolão, quiz e enquetes moram lá.
 * Um bloco só, para não poluir a Home com cards de jogo.
 */
export function NationInvite() {
  const navigation = useNavigation();
  const { colors, layout, radius } = useTheme();
  return (
    <Pressable
      onPress={() => navigation.navigate('Tabs', { screen: 'Nacao' })}
      accessibilityRole="button"
      accessibilityLabel="Bolão, quiz do dia e enquetes. Ir para a Nação"
      style={({ pressed }) => ({
        marginHorizontal: layout.gutter,
        backgroundColor: colors.bgRaised,
        borderRadius: radius.l,
        padding: 24,
        gap: 20,
        overflow: 'hidden',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Monogram width={160} opacity={0.08} style={{ position: 'absolute', right: -36, top: -28 }} />
      <View style={{ gap: 8 }}>
        <Text variant="displayM">Jogue com a Nação</Text>
        <Text variant="bodyM" tone="secondary" style={{ maxWidth: 280 }}>
          Monte seu bolão com os amigos, responda o quiz do dia e vote nas enquetes da torcida.
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 24 }}>
        {(
          [
            ['trophy-outline', 'Bolão'],
            ['help-circle-outline', 'Quiz'],
            ['stats-chart-outline', 'Enquetes'],
          ] as const
        ).map(([icon, label]) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name={icon} size={18} color={colors.accentText} />
            <Text variant="labelM">{label}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text variant="labelButton" tone="brand">
          Ir para a Nação
        </Text>
        <Ionicons name="arrow-forward" size={18} color={colors.accentText} />
      </View>
    </Pressable>
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
      <Monogram
        color="white"
        width={150}
        opacity={0.12}
        style={{ position: 'absolute', right: -24, bottom: -30 }}
      />
      <View style={{ gap: 8, paddingRight: 64 }}>
        <Text variant="titleL" tone="onPrimary">
          Seu jogo é hoje
        </Text>
        <Text variant="bodyM" tone="onPrimary" style={{ opacity: 0.85 }}>
          Portão {plan.recommendedGateId} · chegue às {arrival}
          {queue ? ` · fila de ${queue.waitMinutes} min` : ''}
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
