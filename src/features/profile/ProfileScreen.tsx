import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import {
  Avatar,
  Button,
  EmptyState,
  Filters,
  ListGroup,
  ListItem,
  Screen,
  SectionTitle,
  Skeleton,
  Text,
  useTheme,
} from '@/design-system';
import { CATEGORY_LABEL } from '@/features/shared/ContentCards';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { MemberCard } from '@/features/nation/MemberCard';
import type { ContentCategory } from '@/types/content';
import type { HistoryEntry } from '@/types/fan';
import { formatFullDate } from '@/utils/format';

/**
 * Perfil: só o que é do torcedor (sócio, passaporte, conquistas, ídolos).
 * Configurações, histórico e ajuda ficam na engrenagem do cabeçalho.
 */
export function ProfileScreen() {
  const navigation = useNavigation();
  const { colors, layout, radius } = useTheme();
  const { profile } = useAppState();
  const membership = useAsync(() => services.membership.getMembership());
  const plans = useAsync(() => services.membership.getPlans());
  const passport = useAsync(() => services.gamification.getPassport());
  const medals = useAsync(() => services.gamification.getMedals());
  const squad = useAsync(() => services.matches.getSquad());
  const plan = plans.data?.find((p) => p.id === membership.data?.planId);

  if (!profile)
    return (
      <Screen reserveFab>
        <View style={{ padding: layout.gutter }}>
          <Skeleton height={160} radius={8} />
        </View>
      </Screen>
    );

  const unlocked = medals.data?.filter((m) => m.unlockedAt) ?? [];
  const wins = passport.data?.filter((p) => p.result === 'Vitória').length ?? 0;
  const favorites = squad.data?.filter((p) => profile.favoritePlayerIds.includes(p.id)) ?? [];

  return (
    <Screen reserveFab>
      {/* Você */}
      <View
        style={{
          paddingHorizontal: layout.gutter,
          paddingTop: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Avatar name={profile.name} size={80} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="displayM" accessibilityRole="header" numberOfLines={1}>
            {profile.name}
          </Text>
          <Text variant="bodyS" tone="secondary">
            Rubro-negro desde {profile.fanSince}
          </Text>
        </View>
      </View>

      {/* Sócio-Torcedor */}
      <View style={{ marginTop: 48 }}>
        <SectionTitle
          title="Sócio-Torcedor"
          action="Planos"
          onAction={() => navigation.navigate('Membership')}
        />
        <View style={{ paddingHorizontal: layout.gutter }}>
          {membership.data && plan ? (
            <Pressable
              onPress={() => navigation.navigate('Membership')}
              accessibilityRole="button"
              accessibilityLabel={`Carteirinha ${plan.name}`}
            >
              <MemberCard membership={membership.data} plan={plan} />
            </Pressable>
          ) : (
            <Skeleton height={200} radius={radius.l} />
          )}
        </View>
      </View>

      {/* Passaporte */}
      <View style={{ marginTop: 48 }}>
        <SectionTitle
          title="Passaporte Rubro-Negro"
          action="Ver"
          onAction={() => navigation.navigate('Passport')}
        />
        <Pressable
          onPress={() => navigation.navigate('Passport')}
          accessibilityRole="button"
          style={{ flexDirection: 'row', paddingHorizontal: layout.gutter }}
        >
          {[
            [String(passport.data?.length ?? '—'), 'jogos no estádio'],
            [String(wins), 'vitórias'],
          ].map(([v, l]) => (
            <View key={l} style={{ flex: 1 }}>
              <Text variant="displayXl">{v}</Text>
              <Text variant="bodyS" tone="secondary">
                {l}
              </Text>
            </View>
          ))}
        </Pressable>
      </View>

      {/* Conquistas */}
      <View style={{ marginTop: 48 }}>
        <SectionTitle
          title="Conquistas"
          action={`${unlocked.length}/${medals.data?.length ?? 0}`}
          onAction={() => navigation.navigate('Gamification')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 16 }}
        >
          {(medals.data ?? []).map((m) => {
            const on = !!m.unlockedAt;
            return (
              <Pressable
                key={m.id}
                onPress={() => navigation.navigate('Gamification')}
                accessibilityRole="button"
                accessibilityLabel={m.name}
                style={{ width: 72, alignItems: 'center', gap: 8 }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderWidth: 2,
                    borderColor: on ? colors[m.tier] : colors.lineHairline,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={(on ? m.icon : 'lock-closed-outline') as keyof typeof Ionicons.glyphMap}
                    size={26}
                    color={on ? colors[m.tier] : colors.inkTertiary}
                  />
                </View>
                <Text variant="bodyS" tone={on ? 'primary' : 'tertiary'} numberOfLines={2} align="center">
                  {m.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Ídolos */}
      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Meus ídolos" action="Editar" onAction={() => navigation.navigate('Favorites')} />
        {favorites.length === 0 ? (
          <View style={{ paddingHorizontal: layout.gutter }}>
            <Button
              label="Escolher jogadores"
              variant="secondary"
              size="sm"
              onPress={() => navigation.navigate('Favorites')}
            />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 16 }}
          >
            {favorites.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => navigation.navigate('PlayerProfile', { playerId: p.id })}
                accessibilityRole="button"
                accessibilityLabel={p.shortName}
                style={{ width: 72, alignItems: 'center', gap: 8 }}
              >
                <Avatar name={p.shortName} number={p.number} size={56} />
                <Text variant="labelM" numberOfLines={1} align="center">
                  {p.shortName}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

/** Jogadores favoritos e interesses (alimentam o "Para você"). */
export function FavoritesScreen() {
  const navigation = useNavigation();
  const { colors, layout, radius } = useTheme();
  const { profile, toggleFavoritePlayer, updateProfile } = useAppState();
  const squad = useAsync(() => services.matches.getSquad());
  if (!profile) return null;
  const toggleInterest = (c: ContentCategory) =>
    updateProfile({
      interests: profile.interests.includes(c)
        ? profile.interests.filter((x) => x !== c)
        : [...profile.interests, c],
    });

  return (
    <Screen title="Favoritos">
      <SectionTitle title="Jogadores" />
      {squad.loading ? (
        <View style={{ paddingHorizontal: layout.gutter }}>
          <Skeleton height={96} radius={8} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 16 }}
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
                style={{ alignItems: 'center', width: 72, gap: 8 }}
              >
                <View
                  style={{
                    borderWidth: 2,
                    borderColor: fav ? colors.accent : 'transparent',
                    borderRadius: 34,
                    padding: 2,
                  }}
                >
                  <Avatar name={p.shortName} number={p.number} size={56} />
                </View>
                <Text variant="labelM" numberOfLines={1} align="center" tone={fav ? 'brand' : 'secondary'}>
                  {p.shortName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Interesses" />
        <View style={{ paddingHorizontal: layout.gutter, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(Object.keys(CATEGORY_LABEL) as ContentCategory[]).map((c) => {
            const on = profile.interests.includes(c);
            return (
              <Pressable
                key={c}
                onPress={() => toggleInterest(c)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={{
                  height: 32,
                  paddingHorizontal: 12,
                  borderRadius: radius.s,
                  justifyContent: 'center',
                  borderWidth: on ? 0 : 1,
                  borderColor: colors.lineHairline,
                  backgroundColor: on ? colors.inkPrimary : 'transparent',
                }}
              >
                <Text variant="labelM" style={{ color: on ? colors.bgCanvas : colors.inkSecondary }}>
                  {CATEGORY_LABEL[c]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const HISTORY_ICON: Record<HistoryEntry['kind'], keyof typeof Ionicons.glyphMap> = {
  ticket: 'ticket-outline',
  purchase: 'bag-handle-outline',
  points: 'flash-outline',
  medal: 'trophy-outline',
};

type HistFilter = 'todos' | HistoryEntry['kind'];

export function HistoryScreen() {
  const history = useAsync(() => services.profile.getHistory());
  const [hist, setHist] = useState<HistFilter>('todos');
  const items = history.data?.filter((h) => hist === 'todos' || h.kind === hist);
  return (
    <Screen title="Histórico">
      <Filters<HistFilter>
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
      <View style={{ marginTop: 16 }}>
        {history.loading ? null : items?.length === 0 ? (
          <EmptyState compact title="Nada por aqui ainda." />
        ) : (
          <ListGroup>
            {items?.map((h) => (
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
    </Screen>
  );
}
