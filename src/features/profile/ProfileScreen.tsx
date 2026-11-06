import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import {
  Avatar,
  Badge,
  Card,
  DemoBadge,
  ListGroup,
  ListItem,
  Screen,
  SectionHeader,
  SegmentedControl,
  Skeleton,
  Text,
  useTheme,
} from '@/design-system';
import { CATEGORY_LABEL } from '@/features/shared/ContentCards';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { ContentCategory } from '@/types/content';
import type { HistoryEntry } from '@/types/fan';
import { formatFullDate, formatNumber } from '@/utils/format';

const HISTORY_ICON: Record<HistoryEntry['kind'], keyof typeof Ionicons.glyphMap> = {
  ticket: 'ticket-outline',
  purchase: 'bag-handle-outline',
  points: 'flash-outline',
  medal: 'trophy-outline',
};

type HistFilter = 'todos' | HistoryEntry['kind'];

export function ProfileScreen() {
  const navigation = useNavigation();
  const { colors, spacing, layout, radius } = useTheme();
  const { profile, progress, updateProfile, toggleFavoritePlayer } = useAppState();
  const squad = useAsync(() => services.matches.getSquad());
  const history = useAsync(() => services.profile.getHistory());
  const [hist, setHist] = useState<HistFilter>('todos');

  if (!profile)
    return (
      <Screen reserveFab>
        <View style={{ padding: layout.gutter, gap: spacing.lg }}>
          <Skeleton height={160} />
          <Skeleton height={300} />
        </View>
      </Screen>
    );

  const toggleInterest = (c: ContentCategory) =>
    updateProfile({
      interests: profile.interests.includes(c)
        ? profile.interests.filter((x) => x !== c)
        : [...profile.interests, c],
    });

  const histItems = history.data?.filter((h) => hist === 'todos' || h.kind === hist);

  return (
    <Screen reserveFab>
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: spacing.xl, gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <View>
            <Avatar name={profile.name} size={76} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Trocar foto (em breve)"
              style={{
                position: 'absolute',
                right: -4,
                bottom: -4,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: colors.background,
              }}
            >
              <Ionicons name="camera" size={14} color={colors.onPrimary} />
            </Pressable>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="h1" numberOfLines={1}>
              {profile.name}
            </Text>
            <Text variant="caption" tone="secondary">
              {profile.city} · {profile.state} · rubro-negro desde {profile.fanSince}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
              {progress && (
                <Badge
                  label={`Nível ${progress.level.level} · ${progress.level.name}`}
                  tone="brand"
                  icon="shield"
                />
              )}
              <DemoBadge label="Conta demo" />
            </View>
          </View>
        </View>

        {progress && (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {[
              [formatNumber(progress.points), 'Pontos', 'Gamification'],
              [String(progress.attendanceStreak), 'Jogos seguidos', 'Passport'],
              ['Maraca 2', 'Plano sócio', 'Membership'],
            ].map(([v, l, route]) => (
              <Card
                key={l}
                padding="sm"
                style={{ flex: 1 }}
                onPress={() => navigation.navigate(route as never)}
                accessibilityLabel={`${l}: ${v}`}
              >
                <Text variant="numberSm" align="center">
                  {v}
                </Text>
                <Text variant="footnote" tone="secondary" align="center">
                  {l}
                </Text>
              </Card>
            ))}
          </View>
        )}
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Jogadores favoritos" subtitle="Personalizam o “Para você” na Home" />
        {squad.loading ? (
          <View style={{ paddingHorizontal: layout.gutter }}>
            <Skeleton height={96} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: spacing.md }}
          >
            {squad.data?.map((p) => {
              const fav = profile.favoritePlayerIds.includes(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => toggleFavoritePlayer(p.id)}
                  onLongPress={() => navigation.navigate('PlayerProfile', { playerId: p.id })}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: fav }}
                  accessibilityLabel={`${p.shortName}, camisa ${p.number}`}
                  accessibilityHint="Toque para favoritar. Toque longo abre o perfil."
                  style={{ alignItems: 'center', width: 72, gap: 6, opacity: fav ? 1 : 0.55 }}
                >
                  <View
                    style={{
                      borderWidth: 2,
                      borderColor: fav ? colors.primary : 'transparent',
                      borderRadius: 32,
                      padding: 2,
                    }}
                  >
                    <Avatar name={p.shortName} number={p.number} size={52} />
                  </View>
                  <Text
                    variant="footnote"
                    numberOfLines={1}
                    align="center"
                    tone={fav ? 'brand' : 'secondary'}
                  >
                    {p.shortName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={{ marginTop: spacing.xxl, paddingHorizontal: layout.gutter, gap: spacing.md }}>
        <Text variant="h2">Interesses</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {(Object.keys(CATEGORY_LABEL) as ContentCategory[]).map((c) => {
            const on = profile.interests.includes(c);
            return (
              <Pressable
                key={c}
                onPress={() => toggleInterest(c)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={{
                  minHeight: 36,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.pill,
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: on ? colors.primary : colors.border,
                  backgroundColor: on ? colors.primarySubtle : 'transparent',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {on && <Ionicons name="checkmark" size={14} color={colors.primaryText} />}
                <Text variant="label" tone={on ? 'brand' : 'secondary'}>
                  {CATEGORY_LABEL[c]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Histórico" />
        <SegmentedControl<HistFilter>
          segments={[
            { key: 'todos', label: 'Tudo' },
            { key: 'ticket', label: 'Ingressos' },
            { key: 'purchase', label: 'Compras' },
            { key: 'points', label: 'Pontos' },
            { key: 'medal', label: 'Conquistas' },
          ]}
          value={hist}
          onChange={setHist}
        />
        <View style={{ marginTop: spacing.md }}>
          {history.loading ? (
            <View style={{ paddingHorizontal: layout.gutter }}>
              <Skeleton height={200} />
            </View>
          ) : histItems?.length === 0 ? (
            <Text variant="caption" tone="tertiary" align="center">
              Nada por aqui ainda.
            </Text>
          ) : (
            <ListGroup>
              {histItems?.map((h) => (
                <ListItem
                  key={h.id}
                  icon={HISTORY_ICON[h.kind]}
                  title={h.title}
                  subtitle={`${h.detail} · ${formatFullDate(h.date)}`}
                />
              ))}
            </ListGroup>
          )}
        </View>
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Conta" />
        <ListGroup>
          <ListItem
            icon="wallet-outline"
            title="Meus ingressos"
            onPress={() => navigation.navigate('TicketWallet')}
          />
          <ListItem
            icon="card-outline"
            title="Sócio-Torcedor"
            onPress={() => navigation.navigate('Membership')}
          />
          <ListItem
            icon="notifications-outline"
            title="Notificações e privacidade"
            onPress={() => navigation.navigate('Settings')}
          />
          <ListItem
            icon="settings-outline"
            title="Configurações"
            onPress={() => navigation.navigate('Settings')}
          />
        </ListGroup>
      </View>
    </Screen>
  );
}
