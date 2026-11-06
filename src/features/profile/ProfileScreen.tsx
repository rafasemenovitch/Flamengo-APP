import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

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
import type { ContentCategory } from '@/types/content';
import type { HistoryEntry } from '@/types/fan';
import { formatFullDate } from '@/utils/format';

/** Perfil (especificação 13.5): cabeçalho e linhas. */
export function ProfileScreen() {
  const navigation = useNavigation();
  const { layout } = useTheme();
  const { profile, progress, updateProfile } = useAppState();

  if (!profile)
    return (
      <Screen reserveFab>
        <View style={{ padding: layout.gutter }}>
          <Skeleton height={160} radius={8} />
        </View>
      </Screen>
    );

  return (
    <Screen reserveFab>
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: 24, alignItems: 'flex-start', gap: 12 }}>
        <Avatar name={profile.name} size={80} />
        <View style={{ gap: 4 }}>
          <Text variant="displayM" accessibilityRole="header">
            {profile.name}
          </Text>
          {progress && (
            <Text variant="labelM" tone="brand">
              Nível {progress.level.level} · {progress.level.name}
            </Text>
          )}
          <Text variant="bodyS" tone="secondary">
            {profile.city} · rubro-negro desde {profile.fanSince} · conta demonstrativa
          </Text>
        </View>
        <Button
          label="Editar"
          variant="secondary"
          size="sm"
          onPress={() => Alert.alert('Em breve', 'A edição de dados chega junto com o login real.')}
        />
      </View>

      <View style={{ marginTop: 48 }}>
        <ListGroup>
          <ListItem
            icon="heart-outline"
            title="Jogadores favoritos"
            subtitle={`${profile.favoritePlayerIds.length} seguidos · interesses`}
            onPress={() => navigation.navigate('Favorites')}
          />
          <ListItem
            icon="time-outline"
            title="Histórico"
            subtitle="Ingressos, compras, pontos, conquistas"
            onPress={() => navigation.navigate('History')}
          />
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
            title="Notificações"
            onPress={() => navigation.navigate('Settings')}
          />
          <ListItem
            icon="lock-closed-outline"
            title="Privacidade"
            onPress={() => navigation.navigate('Settings')}
          />
          <ListItem
            icon="help-circle-outline"
            title="Ajuda"
            subtitle="Fale com o Assistente Fla"
            onPress={() => navigation.navigate('Assistant')}
          />
          <ListItem
            icon="settings-outline"
            title="Configurações"
            onPress={() => navigation.navigate('Settings')}
          />
          <ListItem
            icon="log-out-outline"
            title="Sair"
            destructive
            chevron={false}
            onPress={() =>
              Alert.alert(
                'Conta demonstrativa',
                'O login real chega numa próxima fase. Sair agora apenas restaura o torcedor demo.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Restaurar demo',
                    style: 'destructive',
                    onPress: () =>
                      services.auth
                        .signOut()
                        .then(() => services.profile.getProfile())
                        .then((p) => updateProfile(p)),
                  },
                ]
              )
            }
          />
        </ListGroup>
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
      <SectionTitle title="Jogadores" subtitle="Toque para seguir. Toque longo abre o perfil." />
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
