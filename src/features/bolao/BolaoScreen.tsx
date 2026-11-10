import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import {
  Button,
  ErrorState,
  Mascot,
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
import type { BolaoSeasonPick } from '@/types/bolao';
import { BOLAO_RULES } from '@/utils/bolaoScoring';
import { formatShortDate } from '@/utils/format';
import { ClosedMatchRow, OpenMatchRow, OptionSheet, PoolRow, Signed } from './BolaoParts';

export type BolaoTab = 'palpites' | 'boloes' | 'regras';

/** Cabeçalho vermelho do Bolão: seus números e o prêmio. */
function BolaoHero({ best }: { best?: { pos: number; name: string } }) {
  const { colors, layout } = useTheme();
  const isFocused = useIsFocused();
  const summary = useAsync(() => services.bolao.getSummary(), [isFocused]);
  const s = summary.data;
  return (
    <View
      style={{
        backgroundColor: colors.bgRed,
        padding: layout.gutter,
        paddingTop: 28,
        gap: 24,
        overflow: 'hidden',
      }}
    >
      <View style={{ position: 'absolute', right: 4, top: 12 }} accessible={false}>
        <Mascot pose="fan-trophy" size={104} />
      </View>
      <Text variant="displayL" tone="onPrimary" style={{ paddingRight: 104 }}>
        Bolão da Nação
      </Text>
      <View style={{ flexDirection: 'row' }}>
        {[
          [s ? String(s.totalPoints) : '—', 'pontos'],
          [s ? String(s.exactScores) : '—', 'placares exatos'],
          [best ? `${best.pos}º` : '—', 'melhor posição'],
        ].map(([v, l]) => (
          <View key={l} style={{ flex: 1, paddingRight: 8 }}>
            <Text variant="displayL" tone="onPrimary">
              {v}
            </Text>
            <Text variant="bodyS" tone="onPrimary" numberOfLines={1} style={{ opacity: 0.8 }}>
              {l}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Ionicons name="trophy" size={18} color={colors.inkOnRed} style={{ marginTop: 1 }} />
        <Text variant="bodyM" tone="onPrimary" style={{ flex: 1, opacity: 0.9 }}>
          Quem terminar o ano em 1º num bolão com {BOLAO_RULES.prizeMinMembers} ou mais participantes ganha{' '}
          {BOLAO_RULES.prizeDiscountPct}% de desconto num ingresso.
        </Text>
      </View>
    </View>
  );
}

function SeasonPicks() {
  const { colors, layout } = useTheme();
  const { showToast } = useAlerts();
  const q = useAsync(() => services.bolao.getSeasonPicks());
  const [open, setOpen] = useState<BolaoSeasonPick>();
  const choose = async (pick: BolaoSeasonPick, optionId: string) => {
    await services.bolao.saveSeasonPick(pick.id, optionId);
    q.reload();
    showToast('Palpite da temporada salvo.');
  };
  return (
    <View>
      <SectionTitle
        title="Palpites da temporada"
        subtitle={
          q.data?.[0] ? `Fecham em ${formatShortDate(q.data[0].locksAt)} e valem pontos extras` : undefined
        }
      />
      <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
        {(q.data ?? []).map((p) => {
          const choice = p.options.find((o) => o.id === p.choiceId);
          return (
            <Pressable
              key={p.id}
              onPress={() => setOpen(p)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                paddingHorizontal: layout.gutter,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderColor: colors.lineHairline,
                backgroundColor: pressed ? colors.bgRaised : 'transparent',
              })}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="titleS">{p.question}</Text>
                <Text variant="bodyM" tone={choice ? 'primary' : 'brand'}>
                  {choice ? choice.label : 'Escolher'}
                </Text>
              </View>
              <Signed value={p.points} tone="secondary" />
            </Pressable>
          );
        })}
      </View>
      {open && (
        <OptionSheet
          visible
          title={open.question}
          subtitle={`Vale ${open.points} pontos. Dá para trocar até ${formatShortDate(open.locksAt)}.`}
          options={open.options}
          value={open.choiceId}
          onSelect={(id) => choose(open, id)}
          onClose={() => setOpen(undefined)}
        />
      )}
    </View>
  );
}

function GuessesTab() {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  const isFocused = useIsFocused();
  const q = useAsync(() => services.bolao.getMatches(), [isFocused]);
  if (q.loading && !q.data)
    return (
      <View style={{ padding: layout.gutter, gap: 12 }}>
        <Skeleton height={110} radius={8} />
        <Skeleton height={110} radius={8} />
      </View>
    );
  if (q.error || !q.data) return <ErrorState compact onRetry={q.reload} />;
  const { open, closed } = q.data;
  const pending = open.filter((m) => !m.locked && !m.guess).length;
  return (
    <View style={{ gap: 48 }}>
      <View>
        <SectionTitle
          title="Próximos jogos"
          subtitle={
            pending
              ? `${pending} ${pending === 1 ? 'jogo' : 'jogos'} sem palpite`
              : 'Todos os palpites feitos'
          }
        />
        <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
          {open.map((m) => (
            <OpenMatchRow
              key={m.match.id}
              item={m}
              onPress={() => navigation.navigate('BolaoGuess', { matchId: m.match.id })}
            />
          ))}
        </View>
      </View>
      <SeasonPicks />
      <View>
        <SectionTitle title="Jogos encerrados" />
        <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
          {closed.map((m) => (
            <ClosedMatchRow key={m.match.id} item={m} />
          ))}
        </View>
      </View>
    </View>
  );
}

function PoolsTab() {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  const isFocused = useIsFocused();
  const q = useAsync(() => services.bolao.getMyPools(), [isFocused]);
  return (
    <View style={{ gap: 32 }}>
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: layout.gutter }}>
        <Button
          label="Criar bolão"
          icon="add"
          onPress={() => navigation.navigate('BolaoCreate')}
          style={{ flex: 1 }}
        />
        <Button
          label="Entrar com código"
          variant="secondary"
          onPress={() => navigation.navigate('BolaoJoin')}
          style={{ flex: 1 }}
        />
      </View>
      {q.loading && !q.data ? (
        <View style={{ paddingHorizontal: layout.gutter, gap: 12 }}>
          <Skeleton height={80} radius={8} />
          <Skeleton height={80} radius={8} />
        </View>
      ) : q.error ? (
        <ErrorState compact onRetry={q.reload} />
      ) : (
        <View>
          <SectionTitle title="Meus bolões" />
          <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
            {q.data?.map((p) => (
              <PoolRow
                key={p.id}
                pool={p}
                onPress={() => navigation.navigate('BolaoPool', { poolId: p.id })}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function RuleRow({
  label,
  detail,
  value,
  prefix = '',
  suffix,
}: {
  label: string;
  detail?: string;
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const { colors, layout } = useTheme();
  return (
    <View
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
        <Text variant="titleS">{label}</Text>
        {detail && (
          <Text variant="bodyS" tone="secondary">
            {detail}
          </Text>
        )}
      </View>
      <Signed value={value} prefix={prefix} suffix={suffix} tone="brand" />
    </View>
  );
}

function RuleBlock({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View>
      <SectionTitle title={title} />
      <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>{children}</View>
    </View>
  );
}

function RulesTab() {
  const { layout } = useTheme();
  const R = BOLAO_RULES;
  const paragraph = (t: string) => (
    <Text variant="bodyM" tone="secondary" style={{ paddingHorizontal: layout.gutter }}>
      {t}
    </Text>
  );
  return (
    <View style={{ gap: 48 }}>
      <RuleBlock title="Placar">
        <RuleRow label="Placar exato" detail="Acertou os gols dos dois times" value={R.exact} />
        <RuleRow label="Resultado e saldo" detail="Ex.: palpite 3 × 2, jogo 2 × 1" value={R.diff} />
        <RuleRow label="Só o resultado" detail="Acertou quem venceu, ou o empate" value={R.result} />
        <RuleRow label="Gols de um time" detail="Errou o resultado, acertou um dos lados" value={R.goals} />
      </RuleBlock>
      <RuleBlock title="Extras do Flamengo">
        <RuleRow label="Artilheiro" detail="O jogador que você escolheu marcou" value={R.scorer} prefix="+" />
        <RuleRow
          label="Garçom"
          detail="O jogador que você escolheu deu assistência"
          value={R.assist}
          prefix="+"
        />
        <RuleRow label="Coringa" detail="Dobra todos os pontos do jogo. Um por mês" value={2} suffix="×" />
      </RuleBlock>
      <RuleBlock title="Temporada">
        <RuleRow label="Artilheiro do Flamengo no ano" value={25} prefix="+" />
        <RuleRow
          label="Maior garçom do Flamengo no ano"
          detail="Mais difícil de prever, vale mais"
          value={30}
          prefix="+"
        />
      </RuleBlock>
      <View style={{ gap: 12 }}>
        <SectionTitle title="Prêmio" />
        {paragraph(
          `Quem terminar a temporada em 1º lugar num bolão com ${R.prizeMinMembers} ou mais participantes ganha ${R.prizeDiscountPct}% de desconto num ingresso para um jogo do Flamengo no Maracanã.`
        )}
      </View>
      <View style={{ gap: 12 }}>
        <SectionTitle title="Como funciona" />
        {paragraph('Seu palpite vale para todos os seus bolões. Dá para mudar até o apito inicial.')}
        {paragraph('Os pontos do bolão também contam na Temporada da Nação, a trilha de prêmios do app.')}
        {paragraph('Os palpites dos amigos ficam escondidos até a bola rolar.')}
        {paragraph(
          'Empate na classificação: vence quem tem mais placares exatos, depois mais resultados certos.'
        )}
        {paragraph('O bolão é só por pontos. Não há apostas nem dinheiro envolvido.')}
      </View>
    </View>
  );
}

/** Bolão da Nação: um app dentro do app (palpites, bolões entre amigos e regras). */
export function BolaoScreen({ route }: RootScreenProps<'Bolao'>) {
  const [tab, setTab] = useState<BolaoTab>(route.params?.tab ?? 'palpites');
  const isFocused = useIsFocused();
  const pools = useAsync(() => services.bolao.getMyPools(), [isFocused]);
  const best = pools.data
    ?.filter((p) => p.status === 'member' && p.members.length > 1)
    .map((p) => ({ pos: p.members.findIndex((m) => m.isYou) + 1, name: p.name }))
    .sort((a, b) => a.pos - b.pos)[0];

  return (
    <Screen title="Bolão">
      <BolaoHero best={best} />
      <View style={{ marginTop: 8 }}>
        <Tabs<BolaoTab>
          accessibilityLabel="Seções do bolão"
          segments={[
            { key: 'palpites', label: 'Palpites' },
            { key: 'boloes', label: 'Meus bolões' },
            { key: 'regras', label: 'Regras' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <View style={{ paddingTop: 24 }}>
        {tab === 'palpites' && <GuessesTab />}
        {tab === 'boloes' && <PoolsTab />}
        {tab === 'regras' && <RulesTab />}
      </View>
      <View style={{ height: 48 }} />
    </Screen>
  );
}
