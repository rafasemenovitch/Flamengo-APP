import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Linking, Share, View } from 'react-native';

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
import type { BolaoMatch, BolaoMemberGuess, BolaoPool } from '@/types/bolao';
import { BOLAO_RULES } from '@/utils/bolaoScoring';
import { InviteQR, SCOPE_LABEL, ScoreText, Signed } from './BolaoParts';

type PoolTab = 'classificacao' | 'rodada' | 'convidar';

export const inviteLink = (code: string) => `https://flamengo.app/bolao/${code}`;
export const inviteMessage = (pool: Pick<BolaoPool, 'name' | 'code'>) =>
  `Entra no meu bolão "${pool.name}" no Flamengo App! Código: ${pool.code}\n${inviteLink(pool.code)}`;

function Movement({ n }: { n: number }) {
  const { colors } = useTheme();
  if (n === 0) return <View style={{ width: 14 }} />;
  return (
    <Ionicons
      name={n > 0 ? 'caret-up' : 'caret-down'}
      size={12}
      color={n > 0 ? colors.success : colors.accentText}
      accessibilityLabel={n > 0 ? `subiu ${n}` : `caiu ${-n}`}
      style={{ width: 14 }}
    />
  );
}

function Standings({ pool }: { pool: BolaoPool }) {
  const { colors, layout } = useTheme();
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: layout.gutter,
          paddingBottom: 10,
          gap: 8,
        }}
      >
        <Text variant="labelM" tone="tertiary" style={{ width: 50 }}>
          #
        </Text>
        <Text variant="labelM" tone="tertiary" style={{ flex: 1 }}>
          Participante
        </Text>
        <Text variant="labelM" tone="tertiary" style={{ width: 56, textAlign: 'right' }}>
          Exatos
        </Text>
        <Text variant="labelM" tone="tertiary" style={{ width: 52, textAlign: 'right' }}>
          Pts
        </Text>
      </View>
      {pool.members.map((m, i) => (
        <View
          key={m.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            minHeight: 52,
            paddingHorizontal: layout.gutter,
            borderTopWidth: 1,
            borderColor: colors.lineHairline,
            backgroundColor: m.isYou ? colors.bgRaised : 'transparent',
          }}
        >
          {m.isYou && (
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                backgroundColor: colors.accent,
              }}
            />
          )}
          <View style={{ width: 50, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text variant="numericTable" style={{ width: 26 }}>
              {i + 1}
            </Text>
            <Movement n={m.movement} />
          </View>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              variant="titleS"
              numberOfLines={1}
              style={{ flexShrink: 1, color: m.isYou ? colors.accentText : colors.inkPrimary }}
            >
              {m.name}
            </Text>
            {i === 0 && <Ionicons name="trophy" size={14} color={colors.gold} accessibilityLabel="líder" />}
            {m.isAdmin && (
              <Text variant="bodyS" tone="tertiary">
                admin
              </Text>
            )}
          </View>
          <Text variant="numericTable" tone="secondary" style={{ width: 56, textAlign: 'right' }}>
            {m.exactScores}
          </Text>
          <Text variant="numericTable" style={{ width: 52, textAlign: 'right' }}>
            {m.points}
          </Text>
        </View>
      ))}
    </View>
  );
}

function GuessList({
  rows,
  showPoints,
  guessed,
}: {
  rows: BolaoMemberGuess[];
  showPoints: boolean;
  /** Quem já palpitou no jogo (palpite escondido até a bola rolar). */
  guessed?: Set<string>;
}) {
  const { colors, layout } = useTheme();
  return (
    <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
      {rows.map((r) => (
        <View
          key={r.memberId}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            minHeight: 52,
            paddingHorizontal: layout.gutter,
            borderBottomWidth: 1,
            borderColor: colors.lineHairline,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="titleS" style={{ color: r.isYou ? colors.accentText : colors.inkPrimary }}>
              {r.name}
            </Text>
            {r.guess?.scorer && (
              <Text variant="bodyS" tone="tertiary">
                Gol: {r.guess.scorer}
              </Text>
            )}
          </View>
          {r.guess ? (
            <ScoreText home={r.guess.home} away={r.guess.away} />
          ) : (
            <Ionicons
              name="eye-off-outline"
              size={18}
              color={colors.inkTertiary}
              accessibilityLabel="escondido"
            />
          )}
          {showPoints && (
            <View style={{ width: 48, alignItems: 'flex-end' }}>
              {r.points !== undefined ? (
                <Signed value={r.points} variant="numericTable" tone={r.points ? 'brand' : 'tertiary'} />
              ) : (
                <Text variant="numericTable" tone="tertiary">
                  —
                </Text>
              )}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function Round({ pool, next, last }: { pool: BolaoPool; next?: BolaoMatch; last?: BolaoMatch }) {
  const navigation = useNavigation();
  const { layout } = useTheme();
  const nextQ = useAsync(
    () => (next ? services.bolao.getPoolGuesses(pool.id, next.match.id) : Promise.resolve([])),
    [pool.id, next?.match.id, next?.guess?.savedAt]
  );
  const lastQ = useAsync(
    () => (last ? services.bolao.getPoolGuesses(pool.id, last.match.id) : Promise.resolve([])),
    [pool.id, last?.match.id]
  );
  const guessed = pool.members.filter((m) => m.guessedNext).length;
  return (
    <View style={{ gap: 48 }}>
      {next && (
        <View>
          <SectionTitle
            title={`${next.match.homeTeam.shortName} × ${next.match.awayTeam.shortName}`}
            subtitle={`${guessed} de ${pool.members.length} já palpitaram · os palpites aparecem quando a bola rolar`}
          />
          {!next.guess && !next.locked && (
            <View style={{ paddingHorizontal: layout.gutter, marginBottom: 16 }}>
              <Button
                label="Dar meu palpite"
                onPress={() => navigation.navigate('BolaoGuess', { matchId: next.match.id })}
                fullWidth
              />
            </View>
          )}
          {nextQ.data ? (
            <GuessList
              rows={nextQ.data}
              showPoints={false}
              guessed={new Set(pool.members.filter((m) => m.guessedNext).map((m) => m.id))}
            />
          ) : (
            <Skeleton height={160} radius={0} />
          )}
        </View>
      )}
      {last && last.match.score && (
        <View>
          <SectionTitle
            title={`${last.match.homeTeam.shortName} ${last.match.score.home} × ${last.match.score.away} ${last.match.awayTeam.shortName}`}
            subtitle="Último jogo: palpites e pontos de cada um"
          />
          {lastQ.error ? (
            <ErrorState compact onRetry={lastQ.reload} />
          ) : lastQ.data ? (
            <GuessList rows={[...lastQ.data].sort((a, b) => (b.points ?? 0) - (a.points ?? 0))} showPoints />
          ) : (
            <Skeleton height={160} radius={0} />
          )}
        </View>
      )}
    </View>
  );
}

function Invite({ pool }: { pool: BolaoPool }) {
  const { colors, layout } = useTheme();
  const sendWhatsApp = async () => {
    const url = `whatsapp://send?text=${encodeURIComponent(inviteMessage(pool))}`;
    try {
      await Linking.openURL(url);
    } catch {
      Share.share({ message: inviteMessage(pool) });
    }
  };
  return (
    <View style={{ paddingHorizontal: layout.gutter, alignItems: 'center', gap: 24 }}>
      <Text variant="bodyL" tone="secondary" align="center">
        Mande o código ou o QR para os amigos.
        {pool.requireApproval ? ' Quem entrar precisa da sua aprovação.' : ''}
      </Text>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text variant="bodyS" tone="tertiary">
          Código do bolão
        </Text>
        <Text variant="displayXl" selectable style={{ letterSpacing: 6 }}>
          {pool.code}
        </Text>
      </View>
      <InviteQR value={inviteLink(pool.code)} />
      <View style={{ alignSelf: 'stretch', gap: 12 }}>
        <Button label="Enviar no WhatsApp" icon="logo-whatsapp" onPress={sendWhatsApp} fullWidth />
        <Button
          label="Compartilhar"
          variant="secondary"
          icon="share-outline"
          onPress={() => Share.share({ message: inviteMessage(pool) })}
          fullWidth
        />
      </View>
      <Text
        variant="bodyS"
        tone="tertiary"
        align="center"
        style={{ borderTopWidth: 1, borderColor: colors.lineHairline, paddingTop: 16, alignSelf: 'stretch' }}
      >
        {pool.members.length >= BOLAO_RULES.prizeMinMembers
          ? `Com ${pool.members.length} participantes, o campeão deste bolão ganha ${BOLAO_RULES.prizeDiscountPct}% off num ingresso.`
          : `Chame mais ${BOLAO_RULES.prizeMinMembers - pool.members.length} para o campeão ganhar ${BOLAO_RULES.prizeDiscountPct}% off num ingresso.`}
      </Text>
    </View>
  );
}

function Requests({ pool, onChange }: { pool: BolaoPool; onChange: (p: BolaoPool) => void }) {
  const { colors, layout } = useTheme();
  const { showToast } = useAlerts();
  if (!pool.isAdmin || pool.requests.length === 0) return null;
  const answer = async (id: string, name: string, approve: boolean) => {
    onChange(await services.bolao.answerRequest(pool.id, id, approve));
    showToast(approve ? `${name} entrou no bolão.` : 'Pedido recusado.');
  };
  return (
    <View style={{ marginTop: 32 }}>
      <SectionTitle title="Pedidos para entrar" />
      <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
        {pool.requests.map((r) => (
          <View
            key={r.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: layout.gutter,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor: colors.lineHairline,
            }}
          >
            <Text variant="titleS" style={{ flex: 1 }}>
              {r.name}
            </Text>
            <Button label="Recusar" size="sm" variant="ghost" onPress={() => answer(r.id, r.name, false)} />
            <Button label="Aprovar" size="sm" onPress={() => answer(r.id, r.name, true)} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Um bolão: classificação, a rodada (palpites dos amigos), convite e pedidos. */
export function BolaoPoolScreen({ route }: RootScreenProps<'BolaoPool'>) {
  const navigation = useNavigation();
  const { layout } = useTheme();
  const isFocused = useIsFocused();
  const { poolId } = route.params;
  const [tab, setTab] = useState<PoolTab>(route.params.tab ?? 'classificacao');
  const [override, setOverride] = useState<BolaoPool>();
  const q = useAsync(async () => {
    const [pool, matches] = await Promise.all([services.bolao.getPool(poolId), services.bolao.getMatches()]);
    const inScope = (m: BolaoMatch) => pool.scope === 'todos' || m.match.competitionId === pool.scope;
    return { pool, next: matches.open.find(inScope), last: matches.closed.find(inScope) };
  }, [poolId, isFocused]);

  if (q.loading && !q.data)
    return (
      <Screen title="Bolão">
        <View style={{ padding: layout.gutter, gap: 16 }}>
          <Skeleton height={80} radius={8} />
          <Skeleton height={300} radius={8} />
        </View>
      </Screen>
    );
  if (q.error || !q.data)
    return (
      <Screen title="Bolão" scroll={false}>
        <ErrorState onRetry={q.reload} />
      </Screen>
    );
  const pool = override?.id === q.data.pool.id ? override : q.data.pool;
  const you = pool.members.findIndex((m) => m.isYou) + 1;
  const prize = pool.members.length >= BOLAO_RULES.prizeMinMembers;

  const leave = () =>
    Alert.alert('Sair do bolão?', 'Seus pontos continuam valendo nos outros bolões.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await services.bolao.leavePool(pool.id);
          navigation.goBack();
        },
      },
    ]);

  return (
    <Screen title="Bolão" refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ paddingHorizontal: layout.gutter, gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Text variant="displayL">{pool.name}</Text>
          <Text variant="bodyM" tone="secondary">
            {pool.members.length} {pool.members.length === 1 ? 'participante' : 'participantes'} ·{' '}
            {SCOPE_LABEL[pool.scope]}
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Text variant="displayL">{you}º</Text>
            <Text variant="bodyS" tone="secondary">
              sua posição
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="displayL">{pool.members[you - 1]?.points ?? 0}</Text>
            <Text variant="bodyS" tone="secondary">
              seus pontos
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="displayL" tone={prize ? 'brand' : 'tertiary'}>
              {BOLAO_RULES.prizeDiscountPct}%
            </Text>
            <Text variant="bodyS" tone="secondary">
              {prize ? 'prêmio ativo' : 'prêmio com 10+'}
            </Text>
          </View>
        </View>
      </View>

      <Requests pool={pool} onChange={setOverride} />

      <View style={{ marginTop: 32 }}>
        <Tabs<PoolTab>
          accessibilityLabel="Seções do bolão"
          segments={[
            { key: 'classificacao', label: 'Classificação' },
            { key: 'rodada', label: 'Rodada' },
            { key: 'convidar', label: 'Convidar' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <View style={{ paddingTop: 24 }}>
        {tab === 'classificacao' && <Standings pool={pool} />}
        {tab === 'rodada' && <Round pool={pool} next={q.data.next} last={q.data.last} />}
        {tab === 'convidar' && <Invite pool={pool} />}
      </View>

      {!pool.isAdmin && (
        <View style={{ paddingHorizontal: layout.gutter, marginTop: 48 }}>
          <Button label="Sair do bolão" variant="ghost" onPress={leave} fullWidth />
        </View>
      )}
      <View style={{ height: 48 }} />
    </Screen>
  );
}
