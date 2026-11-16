import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ErrorState, LiveIndicator, Text, useTheme } from '@/design-system';
import { useAppState } from '@/state/AppStateProvider';
import type { FanProgress } from '@/types/gamification';
import type { MatchDetail } from '@/types/match';
import type { MatchDayPlan } from '@/types/stadium';
import { formatNumber } from '@/utils/format';
import { haptic } from '@/utils/haptics';
import { HeroMatchCard } from '../HeroMatchCard';
import { LevelStrip, MatchdayBanner, QuickActions } from '../HomeParts';

/**
 * LABORATÓRIO DA HOME (estudo, não é a Home oficial).
 *
 * Cinco arranjos alternativos do topo da Home para comparar em prints. Só aparecem na web com
 * `?home=1` … `?home=5` no endereço; sem isso a Home de sempre fica exatamente como está.
 * Prints: docs/screens/home-variantes/. O feed abaixo (notícias, FlaTV, tabela…) é o mesmo.
 */
export const HOME_VARIANT: number | null = (() => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const n = Number(new URLSearchParams(window.location.search).get('home'));
  return n >= 1 && n <= 5 ? n : null;
})();

/** Variantes em que o assistente sai do botão flutuante e vai para o topo ou os atalhos. */
export const HOME_LAB_HIDES_FAB = HOME_VARIANT === 2 || HOME_VARIANT === 4;

function levelProgress(p: FanProgress) {
  if (!p.nextLevel) return 1;
  return (p.points - p.level.minPoints) / (p.nextLevel.minPoints - p.level.minPoints);
}

interface TopProps {
  variant: number;
  match?: MatchDetail;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  matchday: boolean;
  plan?: MatchDayPlan;
  onSecretLongPress: () => void;
}

/** Topo da Home numa das cinco variantes. */
export function HomeTopVariant(p: TopProps) {
  const { layout } = useTheme();
  const hero = (
    <View style={{ marginTop: p.variant === 4 ? 16 : 24 }}>
      {p.error ? (
        <ErrorState compact onRetry={p.onRetry} />
      ) : (
        <HeroMatchCard match={p.match} loading={p.loading} />
      )}
    </View>
  );
  const banner = p.matchday && p.match && (
    <View style={{ marginTop: 32 }}>
      <MatchdayBanner match={p.match} plan={p.plan} />
    </View>
  );

  switch (p.variant) {
    // 1. Nível no canto: o espaço vazio à direita da saudação vira o nível e os pontos.
    case 1:
      return (
        <>
          <Greeting {...p} right={<LevelCorner />} />
          {hero}
          <View style={{ marginTop: 24 }}>
            <QuickActions matchday={p.matchday} />
          </View>
          <NextReward style={{ marginTop: 24 }} />
          {banner}
        </>
      );
    // 2. Assistente no topo: sai o botão flutuante, entra um botão fixo ao lado do nome.
    case 2:
      return (
        <>
          <Greeting {...p} right={<AssistantButton />} />
          {hero}
          <View style={{ marginTop: 24 }}>
            <QuickActions matchday={p.matchday} />
          </View>
          <View style={{ marginTop: 32 }}>
            <LevelStrip />
          </View>
          {banner}
        </>
      );
    // 3. Anel de nível: o progresso da trilha vira um anel com o número do nível.
    case 3:
      return (
        <>
          <Greeting {...p} right={<LevelRing />} />
          {hero}
          <View style={{ marginTop: 24 }}>
            <QuickActions matchday={p.matchday} />
          </View>
          <NextReward style={{ marginTop: 24 }} />
          {banner}
        </>
      );
    // 4. Topo compacto: saudação numa linha com o nível; jogo logo em cima; assistente nos atalhos.
    case 4:
      return (
        <>
          <CompactGreeting {...p} />
          {hero}
          <View style={{ marginTop: 24 }}>
            <FiveActions matchday={p.matchday} />
          </View>
          <NextReward style={{ marginTop: 24 }} />
          {banner}
        </>
      );
    // 5. Trilha como fio: pontos à direita e a barra da trilha de ponta a ponta sob o nome.
    default:
      return (
        <>
          <Greeting {...p} right={<PointsCorner />} />
          <TrailLine style={{ marginTop: 16, paddingHorizontal: layout.gutter }} />
          {hero}
          <View style={{ marginTop: 24 }}>
            <QuickActions matchday={p.matchday} />
          </View>
          {banner}
        </>
      );
  }
}

/** Saudação igual à de hoje, com um elemento à direita. */
function Greeting({
  matchday,
  onSecretLongPress,
  right,
}: Pick<TopProps, 'matchday' | 'onSecretLongPress'> & { right: ReactNode }) {
  const { profile } = useAppState();
  const { layout } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 16,
        paddingHorizontal: layout.gutter,
        paddingTop: 16,
      }}
    >
      <Pressable
        style={{ flex: 1, gap: 4 }}
        onLongPress={() => {
          haptic.medium();
          onSecretLongPress();
        }}
        delayLongPress={600}
        accessible={false}
      >
        <Text variant="bodyL" tone="secondary">
          {matchday ? 'Dia de Mengão,' : 'Olá,'}
        </Text>
        <Text variant="displayL" numberOfLines={1}>
          {profile?.firstName ?? 'torcedor'}
        </Text>
      </Pressable>
      {right}
    </View>
  );
}

function useTrail() {
  const navigation = useNavigation();
  const { progress } = useAppState();
  return { progress, open: () => navigation.navigate('Trail') };
}

/** V1: nível, nome do nível, pontos e barra curta, alinhados à direita. */
function LevelCorner() {
  const { colors } = useTheme();
  const { progress, open } = useTrail();
  if (!progress) return null;
  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`Nível ${progress.level.level}, ${progress.level.name}, ${formatNumber(progress.points)} pontos`}
      style={({ pressed }) => ({ alignItems: 'flex-end', gap: 6, width: 132, opacity: pressed ? 0.7 : 1 })}
    >
      <Text variant="bodyS" tone="secondary">
        Nível {progress.level.level} · {formatNumber(progress.points)} pts
      </Text>
      <Text variant="displayM" tone="brand">
        {progress.level.name}
      </Text>
      <View style={{ alignSelf: 'stretch', height: 3, borderRadius: 2, backgroundColor: colors.bgRaised2 }}>
        <View
          style={{
            width: `${Math.round(levelProgress(progress) * 100)}%`,
            height: 3,
            borderRadius: 2,
            backgroundColor: colors.accent,
          }}
        />
      </View>
    </Pressable>
  );
}

/** V2: o assistente como botão fixo do topo, no lugar do botão flutuante. */
function AssistantButton() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => navigation.navigate('Assistant')}
      accessibilityRole="button"
      accessibilityLabel="Abrir Assistente Fla"
      style={({ pressed }) => ({ alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.inkOnRed} />
      </View>
      <Text variant="labelM" tone="secondary">
        Assistente
      </Text>
    </Pressable>
  );
}

/** V3: anel de progresso com o número do nível dentro. */
function LevelRing() {
  const { colors } = useTheme();
  const { progress, open } = useTrail();
  if (!progress) return null;
  const size = 76;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`Nível ${progress.level.level}, ${progress.level.name}, ${formatNumber(progress.points)} pontos`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ alignItems: 'flex-end' }}>
        <Text variant="displayS" tone="brand">
          {progress.level.name}
        </Text>
        <Text variant="bodyS" tone="secondary">
          {formatNumber(progress.points)} pts
        </Text>
      </View>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.bgRaised2}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.accent}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c * levelProgress(progress)} ${c}`}
          />
        </Svg>
        <Text variant="displayL">{progress.level.level}</Text>
      </View>
    </Pressable>
  );
}

/** V5: pontos grandes à direita; o nível vai no fio logo abaixo. */
function PointsCorner() {
  const { progress, open } = useTrail();
  if (!progress) return null;
  return (
    <Pressable onPress={open} accessibilityRole="button" style={{ alignItems: 'flex-end' }}>
      <Text variant="bodyS" tone="secondary">
        Seus pontos
      </Text>
      <Text variant="displayL">{formatNumber(progress.points)}</Text>
    </Pressable>
  );
}

/** V5: a trilha como um fio de ponta a ponta, com o nível atual e o próximo nas pontas. */
function TrailLine({ style }: { style?: object }) {
  const { colors } = useTheme();
  const { progress, open } = useTrail();
  if (!progress) return null;
  return (
    <Pressable onPress={open} accessibilityRole="button" style={[{ gap: 8 }, style]}>
      <View style={{ height: 3, borderRadius: 2, backgroundColor: colors.bgRaised2 }}>
        <View
          style={{
            width: `${Math.round(levelProgress(progress) * 100)}%`,
            height: 3,
            borderRadius: 2,
            backgroundColor: colors.accent,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="labelM" tone="brand">
          Nível {progress.level.level} · {progress.level.name}
        </Text>
        {progress.nextLevel && (
          <Text variant="labelM" tone="secondary">
            {formatNumber(progress.nextLevel.minPoints - progress.points)} para {progress.nextLevel.name}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/** V4: saudação numa linha só, com o nível ao lado. */
function CompactGreeting({ matchday, onSecretLongPress }: Pick<TopProps, 'matchday' | 'onSecretLongPress'>) {
  const { profile } = useAppState();
  const { layout, colors } = useTheme();
  const { progress, open } = useTrail();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: layout.gutter,
        paddingTop: 16,
        gap: 12,
      }}
    >
      <Pressable
        style={{ flex: 1 }}
        onLongPress={() => {
          haptic.medium();
          onSecretLongPress();
        }}
        delayLongPress={600}
        accessible={false}
      >
        <Text variant="bodyS" tone="secondary">
          {matchday ? 'Dia de Mengão' : 'Olá'}
        </Text>
        <Text variant="displayM" numberOfLines={1}>
          {profile?.firstName ?? 'torcedor'}
        </Text>
      </Pressable>
      {progress && (
        <Pressable
          onPress={open}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 14,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.lineHairline,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text variant="titleS" tone="brand">
            {progress.level.name}
          </Text>
          <View style={{ width: 1, height: 18, backgroundColor: colors.lineHairline }} />
          <Text variant="titleS">{formatNumber(progress.points)} pts</Text>
        </Pressable>
      )}
    </View>
  );
}

/** V4: os atalhos de hoje mais o Assistente, em cinco colunas com fio fino. */
function FiveActions({ matchday }: { matchday: boolean }) {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  const items: {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    live?: boolean;
    accent?: boolean;
  }[] = [
    {
      key: 'maraca',
      label: 'Maracanã',
      icon: 'location-outline',
      onPress: () => navigation.navigate('StadiumMode'),
      live: matchday,
    },
    { key: 'socio', label: 'Sócio', icon: 'card-outline', onPress: () => navigation.navigate('Membership') },
    { key: 'loja', label: 'Loja', icon: 'bag-handle-outline', onPress: () => navigation.navigate('Store') },
    { key: 'midia', label: 'Mídia', icon: 'newspaper-outline', onPress: () => navigation.navigate('News') },
    {
      key: 'ia',
      label: 'Assistente',
      icon: 'chatbubble-ellipses-outline',
      onPress: () => navigation.navigate('Assistant'),
      accent: true,
    },
  ];
  return (
    <View style={{ flexDirection: 'row', marginHorizontal: layout.gutter - 8 }}>
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
            <Ionicons
              name={it.icon}
              size={26}
              color={it.live || it.accent ? colors.accentText : colors.inkPrimary}
            />
            {it.live && (
              <View style={{ position: 'absolute', top: -2, right: -6 }}>
                <LiveIndicator compact size={6} />
              </View>
            )}
          </View>
          <Text variant="labelM" tone={it.live || it.accent ? 'brand' : 'secondary'} numberOfLines={1}>
            {it.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Próximo prêmio numa linha (o que sobra da faixa de nível quando ela sobe para o topo). */
function NextReward({ style }: { style?: object }) {
  const { colors, layout } = useTheme();
  const { progress, open } = useTrail();
  if (!progress?.nextReward) return null;
  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginHorizontal: layout.gutter,
          paddingVertical: 14,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.lineHairline,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Ionicons
        name={progress.nextReward.icon as keyof typeof Ionicons.glyphMap}
        size={16}
        color={colors.accentText}
      />
      <Text variant="bodyS" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
        Próximo prêmio: {progress.nextReward.title}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.inkTertiary} />
    </Pressable>
  );
}
