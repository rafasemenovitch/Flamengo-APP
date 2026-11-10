import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  Button,
  ErrorState,
  Mascot,
  Screen,
  SectionTitle,
  Skeleton,
  Text,
  useAlerts,
  useTheme,
} from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import type { CommunityGroup } from '@/types/gamification';
import { formatCompact, formatCurrency, formatMatchDate, formatTime } from '@/utils/format';

/** Nome do grupo com selo de reconhecido pelo clube ou cadeado de grupo fechado. */
export function GroupName({
  group,
  variant = 'titleM',
}: {
  group: CommunityGroup;
  variant?: 'titleM' | 'titleS';
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text variant={variant} numberOfLines={1} style={{ flexShrink: 1 }}>
        {group.name}
      </Text>
      {group.verified && (
        <Ionicons
          name="checkmark-circle"
          size={16}
          color={colors.accentText}
          accessibilityLabel="Grupo reconhecido"
        />
      )}
      {group.private && <Ionicons name="lock-closed" size={13} color={colors.inkTertiary} />}
    </View>
  );
}

function groupLine(g: CommunityGroup) {
  if (g.private) return `${g.members} amigos`;
  return `${g.region.split(' — ')[0]} · ${formatCompact(g.members)} membros`;
}

function hostLine(g: CommunityGroup) {
  return g.host ? `Anfitrião: ${g.host}` : undefined;
}

/** Linha de grupo: nome, alcance e o próximo encontro; barra vermelha se você participa. */
export function GroupRow({
  group: g,
  onToggle,
  onPress,
  description,
}: {
  group: CommunityGroup;
  onToggle?: () => void;
  onPress?: () => void;
  description?: boolean;
}) {
  const { colors, layout } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: layout.gutter,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: colors.lineHairline,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {g.joined && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 14,
            bottom: 14,
            width: 3,
            backgroundColor: colors.accent,
          }}
        />
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <GroupName group={g} />
        <Text variant="bodyS" tone="secondary">
          {groupLine(g)}
        </Text>
        {description && (
          <Text variant="bodyS" tone="tertiary" style={{ marginTop: 4 }}>
            {g.description}
          </Text>
        )}
        {description && hostLine(g) && (
          <Text variant="bodyS" tone="tertiary">
            {hostLine(g)}
          </Text>
        )}
        {g.joined && g.nextMeetup && (
          <Text variant="labelM" tone="brand">
            Encontro {formatMatchDate(g.nextMeetup)}
          </Text>
        )}
      </View>
      {onToggle && !g.private && (
        <Button
          label={g.joined ? 'Sair' : 'Entrar'}
          size="sm"
          variant={g.joined ? 'ghost' : 'secondary'}
          onPress={onToggle}
        />
      )}
    </Pressable>
  );
}

/** Caravana: de onde sai, quando, vagas e preço. */
export function CaravanRow({ group: g }: { group: CommunityGroup }) {
  const { colors, layout } = useTheme();
  const { showToast } = useAlerts();
  const c = g.caravan!;
  return (
    <View
      style={{
        paddingHorizontal: layout.gutter,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: colors.lineHairline,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <GroupName group={g} variant="titleS" />
          <Text variant="bodyM" tone="secondary">
            Saída {formatTime(c.date)} · {c.departure}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="displayS">{formatCurrency(c.price)}</Text>
          <Text variant="bodyS" tone={c.seatsLeft <= 8 ? 'brand' : 'secondary'}>
            {c.seatsLeft} vagas
          </Text>
        </View>
      </View>
      <Button
        label="Reservar lugar"
        variant="secondary"
        size="sm"
        onPress={() => showToast('Lugar reservado na caravana (demonstração).')}
      />
    </View>
  );
}

/** Comunidade: seus grupos, caravanas para o próximo jogo e grupos para entrar. */
export function CommunityScreen() {
  const { colors, layout } = useTheme();
  const q = useAsync(() => services.gamification.getCommunityGroups());
  const [overrides, setOverrides] = useState<Record<string, CommunityGroup>>({});
  const toggle = async (id: string) => {
    const g = await services.gamification.toggleGroup(id);
    setOverrides((o) => ({ ...o, [id]: g }));
  };
  const groups = (q.data ?? []).map((g) => overrides[g.id] ?? g);
  const mine = groups.filter((g) => g.joined);
  const caravans = groups.filter((g) => g.caravan);
  const others = groups.filter((g) => !g.joined);

  return (
    <Screen title="Grupos da torcida" refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ paddingHorizontal: layout.gutter, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text variant="bodyL" tone="secondary" style={{ flex: 1 }}>
          Rubro-negros do seu bairro, da sua cidade e do mundo. O anfitrião publica os avisos, encontros e
          caravanas; você acompanha e participa.
        </Text>
        <Mascot pose="fan-community" size={104} />
      </View>

      {q.loading ? (
        <View style={{ padding: layout.gutter, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={64} radius={8} />
          ))}
        </View>
      ) : q.error ? (
        <ErrorState compact onRetry={q.reload} />
      ) : (
        <>
          {mine.length > 0 && (
            <View style={{ marginTop: 48 }}>
              <SectionTitle title="Seus grupos" />
              <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
                {mine.map((g) => (
                  <GroupRow key={g.id} group={g} onToggle={() => toggle(g.id)} />
                ))}
              </View>
            </View>
          )}
          {caravans.length > 0 && (
            <View style={{ marginTop: 48 }}>
              <SectionTitle title="Caravanas para o próximo jogo" />
              <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
                {caravans.map((g) => (
                  <CaravanRow key={g.id} group={g} />
                ))}
              </View>
            </View>
          )}
          <View style={{ marginTop: 48 }}>
            <SectionTitle title="Para entrar" />
            <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
              {others.map((g) => (
                <GroupRow key={g.id} group={g} onToggle={() => toggle(g.id)} description />
              ))}
            </View>
          </View>
        </>
      )}
      <View style={{ height: 32 }} />
    </Screen>
  );
}
