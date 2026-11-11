import { Ionicons } from '@expo/vector-icons';
import qrcode from 'qrcode-generator';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';

import { Button, Crest, Text, useTheme } from '@/design-system';
import { competitionName } from '@/features/shared/MatchUI';
import type { BolaoMatch, BolaoPool, BolaoScope } from '@/types/bolao';
import { BOLAO_RULES, POINTS_LABEL } from '@/utils/bolaoScoring';
import { formatDayLabel, formatTime } from '@/utils/format';

/** Rótulo curto (listas). */
export const SCOPE_SHORT: Record<BolaoScope, string> = {
  todos: 'Todos os jogos',
  brasileirao: 'Brasileirão',
  libertadores: 'Libertadores',
  'copa-do-brasil': 'Copa do Brasil',
  carioca: 'Carioca',
};

type DisplayVariant = 'displayHero' | 'displayXl' | 'displayL' | 'displayM' | 'displayS' | 'numericTable';
type Tone = 'primary' | 'secondary' | 'tertiary' | 'brand' | 'onPrimary';

/**
 * Placar com o "×" na fonte de texto: na Anybody o sinal sai minúsculo.
 */
export function ScoreText({
  home,
  away,
  variant = 'displayS',
  tone,
}: {
  home: number;
  away: number;
  variant?: DisplayVariant;
  tone?: Tone;
}) {
  const { fonts } = useTheme();
  return (
    <Text variant={variant} tone={tone} accessibilityLabel={`${home} a ${away}`}>
      {home}
      <Text tone={tone} style={{ fontFamily: fonts.regular }}>
        {' × '}
      </Text>
      {away}
    </Text>
  );
}

/** Número com sinal ("+14", "2×") com o sinal na fonte de texto. */
export function Signed({
  value,
  prefix = '+',
  suffix,
  variant = 'displayS',
  tone,
}: {
  value: number | string;
  prefix?: string;
  suffix?: string;
  variant?: DisplayVariant;
  tone?: Tone;
}) {
  const { fonts } = useTheme();
  return (
    <Text variant={variant} tone={tone}>
      {prefix ? (
        <Text tone={tone} style={{ fontFamily: fonts.semibold }}>
          {prefix}
        </Text>
      ) : null}
      {value}
      {suffix ? (
        <Text tone={tone} style={{ fontFamily: fonts.semibold }}>
          {suffix}
        </Text>
      ) : null}
    </Text>
  );
}

export const SCOPE_LABEL: Record<BolaoScope, string> = {
  todos: 'Todos os jogos do Flamengo',
  brasileirao: 'Só Brasileirão',
  libertadores: 'Só Libertadores',
  'copa-do-brasil': 'Só Copa do Brasil',
  carioca: 'Só Carioca',
};

/** Quanto falta para o palpite fechar (apito inicial). */
export function closesIn(kickoff: string, now = Date.now()) {
  const min = Math.round((new Date(kickoff).getTime() - now) / 60_000);
  if (min <= 0) return 'Fechado';
  if (min < 60) return `Fecha em ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Fecha em ${h}h`;
  const d = Math.round(h / 24);
  return `Fecha em ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

/** Linha de times compacta: escudos e nomes curtos. */
function TeamsLine({ m }: { m: BolaoMatch['match'] }) {
  return (
    <View style={{ gap: 6 }}>
      {[m.homeTeam, m.awayTeam].map((t) => (
        <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Crest team={t} size={22} />
          <Text variant="titleS" numberOfLines={1}>
            {t.shortName}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Placar em duas linhas (alinhado com os times). */
function ScoreColumn({ home, away, tone }: { home: number; away: number; tone?: 'primary' | 'brand' }) {
  return (
    <View style={{ gap: 6, alignItems: 'flex-end' }}>
      {[home, away].map((n, i) => (
        <Text key={i} variant="displayS" tone={tone} style={{ lineHeight: 22 }}>
          {n}
        </Text>
      ))}
    </View>
  );
}

/**
 * Jogo aberto: data à esquerda, times no meio, palpite à direita.
 * Sem palpite, o lado direito vira o botão "Palpitar".
 */
export function OpenMatchRow({ item, onPress }: { item: BolaoMatch; onPress: () => void }) {
  const { colors, layout } = useTheme();
  const { match: m, guess, locked } = item;
  const scorer = item.guessNames?.scorer;
  const assist = item.guessNames?.assist;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${m.homeTeam.shortName} contra ${m.awayTeam.shortName}. ${guess ? `Seu palpite ${guess.home} a ${guess.away}` : 'Sem palpite'}`}
      style={({ pressed }) => ({
        paddingHorizontal: layout.gutter,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderColor: colors.lineHairline,
        backgroundColor: pressed ? colors.bgRaised : 'transparent',
        gap: 12,
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="labelM" tone="secondary">
          {competitionName(m.competitionId)} · {formatDayLabel(m.kickoff)}, {formatTime(m.kickoff)}
        </Text>
        <Text variant="labelM" tone={locked ? 'tertiary' : guess ? 'secondary' : 'brand'}>
          {locked ? 'Em andamento' : closesIn(m.kickoff)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flex: 1 }}>
          <TeamsLine m={m} />
        </View>
        {guess ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {guess.joker && (
              <Text variant="labelM" tone="brand">
                2×
              </Text>
            )}
            <ScoreColumn home={guess.home} away={guess.away} />
          </View>
        ) : locked ? (
          <Text variant="bodyS" tone="tertiary">
            Sem palpite
          </Text>
        ) : (
          <Button label="Palpitar" size="sm" onPress={onPress} />
        )}
      </View>
      {guess && (scorer || assist) && (
        <Text variant="bodyS" tone="secondary">
          {[scorer && `Gol: ${scorer}`, assist && `Assistência: ${assist}`].filter(Boolean).join('   ')}
        </Text>
      )}
    </Pressable>
  );
}

/** Jogo encerrado: placar final, seu palpite e os pontos ganhos. */
export function ClosedMatchRow({ item }: { item: BolaoMatch }) {
  const { colors, layout } = useTheme();
  const { match: m, guess, points } = item;
  return (
    <View
      style={{
        paddingHorizontal: layout.gutter,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderColor: colors.lineHairline,
        gap: 12,
      }}
    >
      <Text variant="labelM" tone="secondary">
        {competitionName(m.competitionId)} · {formatDayLabel(m.kickoff)}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <View style={{ flex: 1 }}>
          <TeamsLine m={m} />
        </View>
        {m.score && <ScoreColumn home={m.score.home} away={m.score.away} />}
        <View style={{ width: 64, alignItems: 'flex-end' }}>
          {points ? (
            <Signed value={points.total} variant="displayM" tone={points.total > 0 ? 'brand' : 'tertiary'} />
          ) : (
            <Text variant="displayM" tone="tertiary">
              —
            </Text>
          )}
          <Text variant="bodyS" tone="tertiary">
            pts
          </Text>
        </View>
      </View>
      <Text variant="bodyS" tone="secondary">
        {guess
          ? [
              `Seu palpite ${guess.home} × ${guess.away}`,
              points && POINTS_LABEL[points.kind],
              points?.scorer ? `gol de ${item.guessNames?.scorer}` : undefined,
              points?.assist ? `assistência de ${item.guessNames?.assist}` : undefined,
              points?.joker ? 'coringa' : undefined,
            ]
              .filter(Boolean)
              .join(' · ')
          : 'Você não palpitou neste jogo'}
      </Text>
    </View>
  );
}

/** Bolão na lista: nome, posição, participantes e se vale prêmio. */
export function PoolRow({ pool, onPress }: { pool: BolaoPool; onPress: () => void }) {
  const { colors, layout } = useTheme();
  const pos = pool.members.findIndex((m) => m.isYou) + 1;
  const count = pool.members.length;
  const pending = pool.status === 'pending';
  const prize = count >= BOLAO_RULES.prizeMinMembers;
  return (
    <Pressable
      onPress={onPress}
      disabled={pending}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: layout.gutter,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderColor: colors.lineHairline,
        backgroundColor: pressed ? colors.bgRaised : 'transparent',
      })}
    >
      <View style={{ width: 56 }}>
        {pending ? (
          <Ionicons name="hourglass-outline" size={26} color={colors.inkTertiary} />
        ) : (
          <>
            <Text variant="displayM">{pos}º</Text>
            <Text variant="bodyS" tone="tertiary">
              de {count}
            </Text>
          </>
        )}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text variant="titleM" numberOfLines={1}>
          {pool.name}
        </Text>
        <Text variant="bodyS" tone="secondary" numberOfLines={1}>
          {pending
            ? `Aguardando ${pool.adminName} aprovar`
            : pool.isAdmin
              ? `Você administra · ${SCOPE_SHORT[pool.scope]}`
              : `De ${pool.adminName} · ${SCOPE_SHORT[pool.scope]}`}
        </Text>
        {!pending && (
          <Text variant="labelM" tone={prize ? 'brand' : 'tertiary'}>
            {prize
              ? `Vale ${BOLAO_RULES.prizeDiscountPct}% off no ingresso`
              : `Faltam ${BOLAO_RULES.prizeMinMembers - count} para valer prêmio`}
          </Text>
        )}
      </View>
      {pool.isAdmin && pool.requests.length > 0 ? (
        <View
          style={{
            minWidth: 22,
            height: 22,
            borderRadius: 11,
            paddingHorizontal: 6,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="labelTab" style={{ color: colors.inkOnRed }}>
            {pool.requests.length}
          </Text>
        </View>
      ) : (
        !pending && <Ionicons name="chevron-forward" size={20} color={colors.inkTertiary} />
      )}
    </Pressable>
  );
}

/** QR Code real (lido por qualquer câmera) com o link de convite. */
export function InviteQR({ value, size = 184 }: { value: string; size?: number }) {
  const qr = qrcode(0, 'M');
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  const quiet = 2;
  const total = n + quiet * 2;
  const cells: ReactNode[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (qr.isDark(r, c))
        cells.push(
          <Rect key={`${r}-${c}`} x={c + quiet} y={r + quiet} width={1.02} height={1.02} fill="#0A0A0B" />
        );
  return (
    <View
      accessible
      accessibilityLabel="QR Code do convite"
      style={{ width: size, height: size, backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${total} ${total}`}>
        {cells}
      </Svg>
    </View>
  );
}

/** Folha de opções (lista com seleção única). */
export function OptionSheet({
  visible,
  title,
  subtitle,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: { id: string; label: string; detail?: string }[];
  value?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const { colors, layout, radius } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
        onPress={onClose}
        accessible={false}
      >
        <Pressable onPress={() => undefined} accessible={false} style={{ maxHeight: '80%' }}>
          <SafeAreaView
            edges={['bottom']}
            style={{
              backgroundColor: colors.bgRaised,
              borderTopLeftRadius: radius.l,
              borderTopRightRadius: radius.l,
            }}
          >
            <View style={{ paddingHorizontal: layout.gutter, paddingTop: 20, paddingBottom: 12, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="displayS" style={{ flex: 1 }}>
                  {title}
                </Text>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                  hitSlop={12}
                >
                  <Ionicons name="close" size={24} color={colors.inkPrimary} />
                </Pressable>
              </View>
              {subtitle && (
                <Text variant="bodyM" tone="secondary">
                  {subtitle}
                </Text>
              )}
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              {options.map((o) => {
                const on = o.id === value;
                return (
                  <Pressable
                    key={o.id}
                    onPress={() => {
                      onSelect(o.id);
                      onClose();
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      minHeight: 52,
                      paddingHorizontal: layout.gutter,
                      gap: 12,
                      backgroundColor: pressed ? colors.bgRaised2 : 'transparent',
                    })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyL" tone={on ? 'primary' : 'secondary'}>
                        {o.label}
                      </Text>
                      {o.detail && (
                        <Text variant="bodyS" tone="tertiary">
                          {o.detail}
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name={on ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={on ? colors.accentText : colors.inkTertiary}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
