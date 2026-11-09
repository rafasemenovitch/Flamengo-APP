import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import {
  Button,
  ErrorState,
  Screen,
  SectionTitle,
  Skeleton,
  Tabs,
  Text,
  useAlerts,
  useTheme,
} from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { FanLevel, FanProgress, PointsRule, PointsSource, TrailReward } from '@/types/gamification';
import { formatNumber, formatShortDate } from '@/utils/format';
import { haptic } from '@/utils/haptics';

type TrailTab = 'trilha' | 'ganhar' | 'extrato';

const SOURCE_LABEL: Record<PointsSource, string> = {
  bolao: 'Bolão',
  quiz: 'Quiz do dia',
  enquete: 'Enquetes',
  presenca: 'Jogos no estádio',
  'pe-quente': 'Pé quente',
  conquista: 'Conquistas',
  socio: 'Sócio-Torcedor',
  loja: 'Loja oficial',
};

const RULE_GROUPS: [PointsRule['group'], string][] = [
  ['jogo', 'Palpites'],
  ['estadio', 'No estádio'],
  ['dia', 'Todo dia'],
  ['torcedor', 'Torcedor'],
];

function daysLeft(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/** Cabeçalho: nível, pontos da temporada, barra até o próximo nível e o próximo prêmio. */
function SeasonHeader({ progress }: { progress: FanProgress }) {
  const { colors, layout, radius } = useTheme();
  const { level, nextLevel, points, nextReward, season } = progress;
  const pct = nextLevel ? (points - level.minPoints) / (nextLevel.minPoints - level.minPoints) : 1;
  return (
    <View style={{ paddingHorizontal: layout.gutter, gap: 20 }}>
      <Text variant="bodyM" tone="secondary">
        Temporada {season.year} · os pontos zeram em 1º de janeiro, daqui a {daysLeft(season.endsAt)} dias
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <Text variant="bodyS" tone="secondary">
            Nível {level.level}
          </Text>
          <Text variant="displayL" tone="brand">
            {level.name}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="displayL">{formatNumber(points)}</Text>
          <Text variant="bodyS" tone="secondary">
            pontos
          </Text>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.bgRaised2, overflow: 'hidden' }}>
          <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: colors.accent }} />
        </View>
        <Text variant="bodyS" tone="secondary">
          {nextLevel
            ? `${formatNumber(nextLevel.minPoints - points)} pontos para ${nextLevel.name}`
            : 'Nível máximo da temporada'}
        </Text>
      </View>
      {nextReward && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: 16,
            borderRadius: radius.l,
            backgroundColor: colors.bgRaised,
          }}
        >
          <Ionicons
            name={nextReward.icon as keyof typeof Ionicons.glyphMap}
            size={26}
            color={colors.accentText}
          />
          <View style={{ flex: 1 }}>
            <Text variant="bodyS" tone="secondary">
              Próximo prêmio
            </Text>
            <Text variant="titleS">{nextReward.title}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="displayS">{formatNumber(nextReward.points - points)}</Text>
            <Text variant="bodyS" tone="tertiary">
              faltam
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

type TrailItem =
  | { kind: 'level'; points: number; level: FanLevel }
  | { kind: 'reward'; points: number; reward: TrailReward }
  | { kind: 'you'; points: number };

const NODE_COL = 56;

/** Coluna da esquerda: a linha da trilha (vermelha até onde você chegou) e o marco. */
function Rail({
  done,
  half,
  first,
  last,
  children,
}: {
  done: boolean;
  /** Linha vermelha só até o meio (marcador "você"). */
  half?: boolean;
  first?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const on = colors.accent;
  const off = colors.bgRaised2;
  return (
    <View style={{ width: NODE_COL, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          top: first ? '50%' : 0,
          height: first || last ? '50%' : '100%',
          width: 4,
          backgroundColor: half ? 'transparent' : done ? on : off,
        }}
      />
      {half && (
        <>
          <View style={{ position: 'absolute', top: 0, height: '50%', width: 4, backgroundColor: on }} />
          <View style={{ position: 'absolute', bottom: 0, height: '50%', width: 4, backgroundColor: off }} />
        </>
      )}
      {children}
    </View>
  );
}

function RewardRow({
  reward,
  points,
  isMember,
  first,
  last,
  onClaimed,
}: {
  reward: TrailReward;
  points: number;
  isMember: boolean;
  first?: boolean;
  last?: boolean;
  onClaimed: (r: TrailReward) => void;
}) {
  const { colors, layout } = useTheme();
  const { showToast } = useAlerts();
  const [claiming, setClaiming] = useState(false);
  const reached = points >= reward.points;
  const blocked = reward.membersOnly && !isMember;
  const claim = async () => {
    setClaiming(true);
    try {
      const r = await services.gamification.claimReward(reward.id);
      haptic.success();
      showToast(`Resgatado! Cupom ${r.claimedCode}`);
      onClaimed(r);
    } finally {
      setClaiming(false);
    }
  };
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingLeft: layout.gutter - 8,
        paddingRight: layout.gutter,
        minHeight: 96,
      }}
    >
      <Rail done={reached} first={first} last={last}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: reached ? colors.accent : colors.bgCanvas,
            borderWidth: reached ? 0 : 2,
            borderColor: colors.bgRaised2,
          }}
        >
          <Ionicons
            name={(reward.claimedCode ? 'checkmark' : reward.icon) as keyof typeof Ionicons.glyphMap}
            size={20}
            color={reached ? colors.inkOnRed : colors.inkTertiary}
          />
        </View>
      </Rail>
      <View style={{ flex: 1, paddingVertical: 16, paddingLeft: 12, gap: 4 }}>
        <Text variant="labelM" tone={reached ? 'brand' : 'tertiary'}>
          {formatNumber(reward.points)} pts{reward.membersOnly ? ' · para sócios' : ''}
        </Text>
        <Text variant="titleM" tone={reached ? 'primary' : 'secondary'}>
          {reward.title}
        </Text>
        <Text variant="bodyS" tone="tertiary">
          {reward.detail}
        </Text>
        {reached && !blocked && (
          <View style={{ marginTop: 8, flexDirection: 'row' }}>
            {reward.claimedCode ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text variant="bodyS" tone="secondary">
                  Cupom
                </Text>
                <Text variant="numericTable" selectable>
                  {reward.claimedCode}
                </Text>
              </View>
            ) : (
              <Button label="Resgatar" size="sm" onPress={claim} loading={claiming} />
            )}
          </View>
        )}
        {reached && blocked && (
          <Text variant="bodyS" tone="secondary" style={{ marginTop: 4 }}>
            Vire sócio para resgatar.
          </Text>
        )}
      </View>
    </View>
  );
}

function LevelRow({
  level,
  points,
  first,
  last,
}: {
  level: FanLevel;
  points: number;
  first?: boolean;
  last?: boolean;
}) {
  const { colors, layout } = useTheme();
  const reached = points >= level.minPoints;
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingLeft: layout.gutter - 8,
        paddingRight: layout.gutter,
        minHeight: 84,
      }}
    >
      <Rail done={reached} first={first} last={last}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            transform: [{ rotate: '45deg' }],
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: reached ? colors.bgRed : colors.bgRaised,
            borderWidth: 2,
            borderColor: reached ? colors.accent : colors.bgRaised2,
          }}
        >
          <Text
            variant="displayS"
            style={{
              transform: [{ rotate: '-45deg' }],
              color: reached ? colors.inkOnRed : colors.inkTertiary,
            }}
          >
            {level.level}
          </Text>
        </View>
      </Rail>
      <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 12 }}>
        <Text variant="bodyS" tone="secondary">
          Nível {level.level} · {formatNumber(level.minPoints)} pts
        </Text>
        <Text variant="displayM" tone={reached ? 'primary' : 'tertiary'}>
          {level.name}
        </Text>
      </View>
    </View>
  );
}

function YouMarker({ points }: { points: number }) {
  const { colors, layout } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingLeft: layout.gutter - 8,
        paddingRight: layout.gutter,
        minHeight: 56,
      }}
    >
      <Rail done half>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.accent,
            borderWidth: 4,
            borderColor: colors.bgCanvas,
          }}
        />
      </Rail>
      <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 12 }}>
        <Text variant="titleS" tone="brand">
          Você está aqui · {formatNumber(points)} pts
        </Text>
      </View>
    </View>
  );
}

function Trail({
  progress,
  levels,
  rewards,
  isMember,
  onMarker,
  onChange,
}: {
  progress: FanProgress;
  levels: FanLevel[];
  rewards: TrailReward[];
  isMember: boolean;
  onMarker: (y: number) => void;
  onChange: (r: TrailReward) => void;
}) {
  const p = progress.points;
  const items: TrailItem[] = [
    ...levels.map((level) => ({ kind: 'level' as const, points: level.minPoints, level })),
    ...rewards.map((reward) => ({ kind: 'reward' as const, points: reward.points, reward })),
    { kind: 'you' as const, points: p + 0.5 },
  ].sort((a, b) => a.points - b.points || (a.kind === 'level' ? -1 : 1));
  return (
    <View>
      {items.map((it, i) => {
        const first = i === 0;
        const last = i === items.length - 1;
        if (it.kind === 'you')
          return (
            <View key="you" onLayout={(e) => onMarker(e.nativeEvent.layout.y)}>
              <YouMarker points={p} />
            </View>
          );
        if (it.kind === 'level')
          return (
            <LevelRow key={`l${it.level.level}`} level={it.level} points={p} first={first} last={last} />
          );
        return (
          <RewardRow
            key={it.reward.id}
            reward={it.reward}
            points={p}
            isMember={isMember}
            first={first}
            last={last}
            onClaimed={onChange}
          />
        );
      })}
    </View>
  );
}

function HowToEarn() {
  const { colors, layout } = useTheme();
  const q = useAsync(() => services.gamification.getPointsRules());
  return (
    <View style={{ gap: 40 }}>
      <Text variant="bodyM" tone="secondary" style={{ paddingHorizontal: layout.gutter }}>
        Uma pontuação só para tudo no app. A escala segue a do bolão: placar exato vale 10.
      </Text>
      {RULE_GROUPS.map(([g, title]) => (
        <View key={g}>
          <SectionTitle title={title} />
          <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
            {(q.data ?? [])
              .filter((r) => r.group === g)
              .map((r) => (
                <View
                  key={r.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    paddingHorizontal: layout.gutter,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderColor: colors.lineHairline,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="titleS">{r.title}</Text>
                    {r.detail && (
                      <Text variant="bodyS" tone="secondary">
                        {r.detail}
                      </Text>
                    )}
                  </View>
                  <Text variant="titleM" tone="brand">
                    {r.points}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      ))}
      <Text variant="bodyS" tone="tertiary" style={{ paddingHorizontal: layout.gutter }}>
        Grupos da torcida e caravanas não dão pontos: são para a torcida se organizar. Os pontos zeram todo 1º
        de janeiro; cupons resgatados valem até a data de cada um.
      </Text>
    </View>
  );
}

function Statement() {
  const { colors, layout } = useTheme();
  const q = useAsync(() => services.gamification.getPointsHistory());
  if (!q.data) return <Skeleton height={300} radius={0} />;
  const totals = Object.entries(
    q.data.reduce<Record<string, number>>(
      (acc, e) => ({ ...acc, [e.source]: (acc[e.source] ?? 0) + e.points }),
      {}
    )
  ).sort((a, b) => b[1] - a[1]);
  const max = totals[0]?.[1] ?? 1;
  return (
    <View style={{ gap: 48 }}>
      <View>
        <SectionTitle title="De onde vieram" />
        <View style={{ paddingHorizontal: layout.gutter, gap: 14 }}>
          {totals.map(([source, value]) => (
            <View key={source} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="titleS">{SOURCE_LABEL[source as PointsSource]}</Text>
                <Text variant="numericTable">{formatNumber(value)}</Text>
              </View>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.bgRaised2 }}>
                <View
                  style={{
                    width: `${(value / max) * 100}%`,
                    height: '100%',
                    borderRadius: 2,
                    backgroundColor: colors.accent,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
      <View>
        <SectionTitle title="Lançamentos" />
        <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
          {q.data.map((e) => (
            <View
              key={e.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                paddingHorizontal: layout.gutter,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderColor: colors.lineHairline,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="titleS">{e.label}</Text>
                <Text variant="bodyS" tone="tertiary">
                  {SOURCE_LABEL[e.source]} · {formatShortDate(e.date)}
                </Text>
              </View>
              <Text variant="titleM" tone="brand">
                +{formatNumber(e.points)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * Temporada da Nação: trilha de prêmios (nível a nível), como ganhar pontos e
 * o extrato. Uma pontuação só para o app inteiro, que zera todo ano.
 */
export function TrailScreen({ route }: RootScreenProps<'Trail'>) {
  const navigation = useNavigation();
  const { layout } = useTheme();
  const { refreshProgress } = useAppState();
  const [tab, setTab] = useState<TrailTab>(route.params?.tab ?? 'trilha');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const trailTop = useRef(0);
  const scrolled = useRef(false);
  const q = useAsync(async () => {
    const [progress, rewards, membership] = await Promise.all([
      services.gamification.getProgress(),
      services.gamification.getTrail(),
      services.membership.getMembership(),
    ]);
    return { progress, rewards, isMember: !!membership };
  });
  const levels = useAsync(() => services.gamification.getLevels());

  const goToMarker = (y: number) => {
    if (scrolled.current) return;
    scrolled.current = true;
    setTimeout(
      () => scroll.current?.scrollTo({ y: Math.max(0, trailTop.current + y - 260), animated: true }),
      300
    );
  };

  return (
    <Screen title="Temporada" scroll={false}>
      <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 64 }}>
        {q.data ? (
          <SeasonHeader progress={q.data.progress} />
        ) : q.error ? (
          <ErrorState compact onRetry={q.reload} />
        ) : (
          <View style={{ paddingHorizontal: layout.gutter }}>
            <Skeleton height={220} radius={8} />
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: layout.gutter, marginTop: 20 }}>
          <Button
            label="Ranking"
            variant="secondary"
            size="sm"
            icon="podium-outline"
            onPress={() => navigation.navigate('Rankings')}
            style={{ flex: 1 }}
          />
          <Button
            label="Conquistas"
            variant="secondary"
            size="sm"
            icon="trophy-outline"
            onPress={() => navigation.navigate('Gamification')}
            style={{ flex: 1 }}
          />
        </View>
        <View style={{ marginTop: 24 }}>
          <Tabs<TrailTab>
            accessibilityLabel="Seções da temporada"
            segments={[
              { key: 'trilha', label: 'Trilha de prêmios' },
              { key: 'ganhar', label: 'Como ganhar' },
              { key: 'extrato', label: 'Extrato' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>
        <View style={{ paddingTop: 24 }} onLayout={(e) => (trailTop.current = e.nativeEvent.layout.y)}>
          {tab === 'trilha' &&
            (q.data && levels.data ? (
              <Trail
                progress={q.data.progress}
                levels={levels.data}
                rewards={q.data.rewards}
                isMember={q.data.isMember}
                onMarker={goToMarker}
                onChange={() => {
                  q.refresh();
                  refreshProgress();
                }}
              />
            ) : (
              <View style={{ paddingHorizontal: layout.gutter }}>
                <Skeleton height={400} radius={8} />
              </View>
            ))}
          {tab === 'ganhar' && <HowToEarn />}
          {tab === 'extrato' && <Statement />}
        </View>
      </ScrollView>
    </Screen>
  );
}
