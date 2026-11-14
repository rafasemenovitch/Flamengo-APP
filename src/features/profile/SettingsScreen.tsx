import { useNavigation } from '@react-navigation/native';
import { Alert, Switch, View } from 'react-native';

import {
  Button,
  ListGroup,
  ListItem,
  Screen,
  SectionTitle,
  SegmentedControl,
  Text,
  useTheme,
  useThemePreference,
  type ThemePreference,
} from '@/design-system';
import { DATA_SOURCE } from '@/services';
import { useAuth } from '@/features/auth/AuthProvider';
import { useOnboarding } from '@/features/onboarding/Onboarding';
import { useAppState } from '@/state/AppStateProvider';
import type { NotificationPrefs, PrivacyPrefs } from '@/types/fan';

const NOTIF: [keyof NotificationPrefs, string, string][] = [
  ['goals', 'Gols', 'Aviso a cada gol do Flamengo e do adversário'],
  ['matchStart', 'Início de jogo', 'Quando a bola rolar'],
  ['matchEnd', 'Fim de jogo', 'Resultado final e melhores momentos'],
  ['lineups', 'Escalações', 'Quando o time for divulgado'],
  ['tickets', 'Ingressos', 'Abertura de vendas e lembretes do jogo'],
  ['news', 'Notícias', 'Principais notícias do dia'],
  ['store', 'Loja', 'Lançamentos e promoções'],
];

const PRIVACY: [keyof PrivacyPrefs, string, string][] = [
  ['showInRankings', 'Aparecer nos rankings', 'Seu nome e cidade na lista de torcedores'],
  ['shareCity', 'Compartilhar cidade', 'Usada em grupos regionais e rankings por estado'],
  ['personalizedContent', 'Conteúdo personalizado', 'Usa favoritos e interesses para o “Para você”'],
];

export function SettingsScreen() {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  const { preference, setPreference } = useThemePreference();
  const { profile, updateProfile, unreadNotifications } = useAppState();
  const { replay } = useOnboarding();
  const { session, signOut: signOutAccount, requestLogin } = useAuth();

  const toggle = (value: boolean, onChange: (v: boolean) => void, label: string) => (
    <Switch
      value={value}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ true: colors.accent, false: colors.bgRaised2 }}
      thumbColor={colors.inkOnRed}
      ios_backgroundColor={colors.bgRaised2}
    />
  );

  const signOut = () =>
    Alert.alert('Sair da conta?', 'Você poderá entrar novamente ou continuar como visitante.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () =>
          signOutAccount().catch(() => Alert.alert('Não foi possível sair', 'Tente novamente em instantes.')),
      },
    ]);

  return (
    <Screen title="Configurações">
      <SectionTitle title="Aparência" />
      <SegmentedControl<ThemePreference>
        segments={[
          { key: 'dark', label: 'Escuro' },
          { key: 'light', label: 'Claro' },
          { key: 'system', label: 'Sistema' },
        ]}
        value={preference}
        onChange={setPreference}
        accessibilityLabel="Tema"
      />

      {profile && (
        <>
          <View style={{ marginTop: 48 }}>
            <SectionTitle
              title="Notificações"
              action={unreadNotifications > 0 ? `${unreadNotifications} novas` : 'Recebidas'}
              onAction={() => navigation.navigate('Notifications')}
            />
            <ListGroup>
              {NOTIF.map(([k, title, sub]) => (
                <ListItem
                  key={k}
                  title={title}
                  subtitle={sub}
                  trailing={toggle(
                    profile.notifications[k],
                    (v) => updateProfile({ notifications: { ...profile.notifications, [k]: v } }),
                    title
                  )}
                />
              ))}
            </ListGroup>
          </View>

          <View style={{ marginTop: 48 }}>
            <SectionTitle title="Privacidade" />
            <ListGroup>
              {PRIVACY.map(([k, title, sub]) => (
                <ListItem
                  key={k}
                  title={title}
                  subtitle={sub}
                  trailing={toggle(
                    profile.privacy[k],
                    (v) => updateProfile({ privacy: { ...profile.privacy, [k]: v } }),
                    title
                  )}
                />
              ))}
            </ListGroup>
          </View>
        </>
      )}

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Atividade" />
        <ListGroup>
          <ListItem
            icon="time-outline"
            title="Histórico"
            subtitle="Ingressos, compras, pontos e conquistas"
            onPress={() => navigation.navigate('History')}
          />
        </ListGroup>
      </View>

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Ajuda" />
        <ListGroup>
          <ListItem
            icon="chatbubble-ellipses-outline"
            title="Falar com o Assistente Fla"
            onPress={() => navigation.navigate('Assistant')}
          />
          <ListItem icon="play-circle-outline" title="Rever boas-vindas" onPress={replay} />
          <ListItem
            icon="map-outline"
            title="Rever apresentação do app"
            onPress={() => navigation.navigate('FeaturePresentation')}
          />
        </ListGroup>
      </View>

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Sobre" />
        <ListGroup>
          <ListItem
            icon="information-circle-outline"
            title="Flamengo App"
            subtitle={`Versão conceito · dados ${DATA_SOURCE === 'demo' ? 'demonstrativos' : 'reais'}`}
          />
          {__DEV__ && (
            <ListItem
              icon="color-palette-outline"
              title="Catálogo do design system"
              onPress={() => navigation.navigate('DesignSystem')}
            />
          )}
        </ListGroup>
      </View>

      <View style={{ marginTop: 48, paddingHorizontal: layout.gutter, gap: 16 }}>
        <Text variant="bodyS" tone="secondary" align="center">
          {session ? session.user.email : 'Você está como visitante'}
        </Text>
        <Button
          label={session ? 'Sair da conta' : 'Entrar na minha conta'}
          variant="secondary"
          onPress={
            session
              ? signOut
              : () => {
                  requestLogin().catch(() => Alert.alert('Não foi possível entrar', 'Tente novamente.'));
                }
          }
          fullWidth
        />
        <Text variant="bodyS" tone="tertiary" align="center">
          Conceito independente, sem vínculo oficial.
        </Text>
      </View>
      <View style={{ height: 32 }} />
    </Screen>
  );
}
