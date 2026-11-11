import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import {
  Avatar,
  Button,
  EmptyState,
  FilterBar,
  ListGroup,
  ListItem,
  Monogram,
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
import { Stamp } from '@/features/nation/gamification/Stamp';
import { StreakCount } from '@/features/shared/Flame';
import { useDemoMember } from '@/hooks/useMatch';
import type { ContentCategory } from '@/types/content';
import type { HistoryEntry } from '@/types/fan';
import { formatFullDate } from '@/utils/format';

/**
 * Perfil: quem é o torcedor (dados, acesso ao estádio, sócio, passaporte,
 * conquistas, ídolos). Configurações ficam na engrenagem do cabeçalho.
 */
export function ProfileScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { colors, layout, radius } = useTheme();
  const { width } = useWindowDimensions();
  const { profile, progress } = useAppState();
  const [isMember] = useDemoMember();
  const membership = useAsync(() => services.membership.getMembership(), [isMember]);
  const plans = useAsync(() => services.membership.getPlans());
  const passport = useAsync(() => services.gamification.getPassport());
  const medals = useAsync(() => services.gamification.getMedals());
  const squad = useAsync(() => services.matches.getSquad());
  const face = useAsync(() => services.profile.getFaceEnrollment(), [isFocused]);
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
  const stamps = [...(passport.data ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const wins = stamps.filter((p) => p.result === 'Vitória').length;
  const favorites = squad.data?.filter((p) => profile.favoritePlayerIds.includes(p.id)) ?? [];
  const streak = progress?.luckyStreak ?? 0;
  const stampSize = Math.floor((width - layout.gutter * 2 - 24) / 3);
  const enrolled = face.data?.status === 'enrolled';

  return (
    <Screen reserveFab>
      {/* Você */}
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: 24, gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Avatar name={profile.name} size={80} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="headline" accessibilityRole="header" numberOfLines={1}>
              {profile.name}
            </Text>
            <Text variant="bodyM" tone="secondary">
              Rubro-negro desde {profile.fanSince}
            </Text>
          </View>
        </View>
        <Button
          label="Editar perfil"
          variant="secondary"
          size="sm"
          onPress={() => navigation.navigate('EditProfile')}
          fullWidth
        />
      </View>

      {/* Cadastro facial: só chama atenção enquanto falta */}
      <View style={{ marginTop: 32 }}>
        <ListGroup>
          <ListItem
            icon="scan-outline"
            title="Cadastro facial"
            subtitle={enrolled ? 'Pronto para entrar no Maracanã' : 'Obrigatório para entrar no Maracanã'}
            trailing={
              enrolled ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              ) : (
                <Text variant="labelM" tone="brand">
                  Cadastrar
                </Text>
              )
            }
            onPress={() => navigation.navigate('FaceEnrollment')}
          />
        </ListGroup>
      </View>

      {/* Sócio-Torcedor: carteirinha para quem é; convite para quem não é */}
      <View style={{ marginTop: 48 }}>
        <SectionTitle
          title="Sócio-Torcedor"
          action={membership.data ? 'Meu plano' : undefined}
          onAction={() => navigation.navigate('Membership')}
        />
        <View style={{ paddingHorizontal: layout.gutter }}>
          {membership.loading || (membership.data && !plan) ? (
            <Skeleton height={200} radius={radius.l} />
          ) : membership.data && plan ? (
            <Pressable
              onPress={() => navigation.navigate('Membership')}
              accessibilityRole="button"
              accessibilityLabel={`Carteirinha ${plan.name}`}
            >
              <MemberCard membership={membership.data} plan={plan} />
            </Pressable>
          ) : (
            <View
              style={{
                backgroundColor: colors.bgRed,
                borderRadius: radius.l,
                padding: 24,
                gap: 16,
                overflow: 'hidden',
              }}
            >
              <Monogram
                color="white"
                width={200}
                opacity={0.12}
                style={{ position: 'absolute', right: -48, bottom: -40 }}
              />
              <Text variant="displayM" tone="onPrimary">
                Seja sócio-torcedor
              </Text>
              <Text variant="bodyM" tone="onPrimary" style={{ opacity: 0.85, maxWidth: 260 }}>
                Prioridade nos ingressos, desconto no Maracanã e na loja.
              </Text>
              <Button
                label="Ver planos de sócio"
                variant="light"
                onPress={() => navigation.navigate('Membership')}
                style={{ alignSelf: 'flex-start' }}
              />
            </View>
          )}
        </View>
      </View>

      {/* Passaporte: pé quente + os últimos carimbos */}
      <View style={{ marginTop: 48 }}>
        <SectionTitle
          title="Passaporte Rubro-Negro"
          action="Abrir"
          onAction={() => navigation.navigate('Passport')}
        />
        <Pressable
          onPress={() => navigation.navigate('Passport')}
          accessibilityRole="button"
          accessibilityLabel={`Passaporte: ${stamps.length} jogos, ${wins} vitórias, pé quente ${streak}`}
          style={{ paddingHorizontal: layout.gutter, gap: 24 }}
        >
          {/* Três colunas iguais, números e legendas na mesma linha. */}
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1 }}>
              <Text variant="displayXl">{stamps.length}</Text>
              <Text variant="bodyS" tone="secondary">
                jogos
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="displayXl">{wins}</Text>
              <Text variant="bodyS" tone="secondary">
                vitórias
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <StreakCount value={streak} />
              <Text variant="bodyS" tone="secondary">
                pé quente
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {stamps.slice(0, 3).map((s) => (
              <Stamp key={s.id} stamp={s} size={stampSize} />
            ))}
          </View>
        </Pressable>
      </View>

      {/* Conquistas */}
      <View style={{ marginTop: 48 }}>
        <SectionTitle
          title="Conquistas"
          action={`${unlocked.length} de ${medals.data?.length ?? 0}`}
          onAction={() => navigation.navigate('Gamification')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 16 }}
        >
          {[...(medals.data ?? [])]
            .sort((a, b) => Number(!!b.unlockedAt) - Number(!!a.unlockedAt))
            .map((m) => {
              const on = !!m.unlockedAt;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => navigation.navigate('Gamification')}
                  accessibilityRole="button"
                  accessibilityLabel={m.name}
                  style={{ width: 76, alignItems: 'center', gap: 8 }}
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
      <FilterBar
        groups={[
          {
            key: 'kind',
            title: 'Mostrar',
            options: [
              { key: 'todos', label: 'Tudo' },
              { key: 'ticket', label: 'Ingressos' },
              { key: 'purchase', label: 'Compras' },
              { key: 'points', label: 'Pontos' },
              { key: 'medal', label: 'Conquistas' },
            ],
          },
        ]}
        value={{ kind: hist }}
        defaults={{ kind: 'todos' }}
        onApply={(v) => setHist(v.kind as HistFilter)}
        count={(v) => history.data?.filter((h) => v.kind === 'todos' || h.kind === v.kind).length ?? 0}
        countLabel={(n) => `${n} ${n === 1 ? 'registro' : 'registros'}`}
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
