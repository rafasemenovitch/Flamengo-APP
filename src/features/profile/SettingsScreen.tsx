import { Alert, Switch, View } from 'react-native';

import { ListGroup, ListItem, Screen, SectionHeader, SegmentedControl, Text, useTheme, useThemePreference, type ThemePreference } from '@/design-system';
import { DATA_SOURCE, services } from '@/services';
import { useOnboarding } from '@/features/onboarding/Onboarding';
import { useAppState } from '@/state/AppStateProvider';
import type { NotificationPrefs, PrivacyPrefs } from '@/types/fan';

const NOTIF: Array<[keyof NotificationPrefs, string, string]> = [
  ['goals', 'Gols', 'Aviso a cada gol do Flamengo e do adversário'],
  ['matchStart', 'Início de jogo', 'Quando a bola rolar'],
  ['matchEnd', 'Fim de jogo', 'Resultado final e melhores momentos'],
  ['lineups', 'Escalações', 'Quando o time for divulgado'],
  ['tickets', 'Ingressos', 'Abertura de vendas e lembretes do jogo'],
  ['news', 'Notícias', 'Principais notícias do dia'],
  ['store', 'Loja', 'Lançamentos e promoções'],
];

const PRIVACY: Array<[keyof PrivacyPrefs, string, string]> = [
  ['showInRankings', 'Aparecer nos rankings', 'Seu nome e cidade na lista de torcedores'],
  ['shareCity', 'Compartilhar cidade', 'Usada em grupos regionais e rankings por estado'],
  ['personalizedContent', 'Conteúdo personalizado', 'Usa favoritos e interesses para o “Para você”'],
];

export function SettingsScreen() {
  const { colors, spacing, layout } = useTheme();
  const { preference, setPreference } = useThemePreference();
  const { profile, updateProfile } = useAppState();
  const { replay } = useOnboarding();

  const toggle = (value: boolean, onChange: (v: boolean) => void, label: string) => (
    <Switch
      value={value}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ true: colors.primary, false: colors.surfaceMuted }}
      thumbColor={colors.onPrimary}
      ios_backgroundColor={colors.surfaceMuted}
    />
  );

  return (
    <Screen title="Configurações">
      <SectionHeader title="Aparência" />
      <SegmentedControl<ThemePreference>
        segments={[{ key: 'dark', label: 'Escuro' }, { key: 'light', label: 'Claro' }, { key: 'system', label: 'Sistema' }]}
        value={preference}
        onChange={setPreference}
        accessibilityLabel="Tema"
      />

      {profile && (
        <>
          <View style={{ marginTop: spacing.xxl }}>
            <SectionHeader title="Notificações" subtitle="Avisos no app (push chega numa fase futura)" />
            <ListGroup>
              {NOTIF.map(([k, title, sub]) => (
                <ListItem key={k} title={title} subtitle={sub} trailing={toggle(profile.notifications[k], (v) => updateProfile({ notifications: { ...profile.notifications, [k]: v } }), title)} />
              ))}
            </ListGroup>
          </View>

          <View style={{ marginTop: spacing.xxl }}>
            <SectionHeader title="Privacidade" />
            <ListGroup>
              {PRIVACY.map(([k, title, sub]) => (
                <ListItem key={k} title={title} subtitle={sub} trailing={toggle(profile.privacy[k], (v) => updateProfile({ privacy: { ...profile.privacy, [k]: v } }), title)} />
              ))}
            </ListGroup>
          </View>
        </>
      )}

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Sobre" />
        <ListGroup>
          <ListItem icon="information-circle-outline" title="Flamengo App · versão conceito" subtitle={`Fonte de dados: ${DATA_SOURCE === 'demo' ? 'demonstrativa' : 'integrações reais'}`} />
          <ListItem icon="play-circle-outline" title="Rever boas-vindas" subtitle="Mostra de novo a apresentação inicial" onPress={replay} />
          <ListItem icon="easel-outline" title="Modo apresentação" subtitle="Na Home, toque e segure a saudação para trocar o momento do jogo" />
          <ListItem icon="flask-outline" title="O que é demonstrativo" subtitle="Placares, ingressos, QR, pagamentos, carteirinha, benefícios e pontos são simulados. Escudo e fotos são placeholders." />
          <ListItem
            icon="log-out-outline"
            title="Sair"
            destructive
            onPress={() =>
              Alert.alert('Conta demonstrativa', 'O login real chega numa próxima fase. Sair agora apenas restaura o torcedor demo.', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Restaurar demo', style: 'destructive', onPress: () => services.auth.signOut().then(() => services.profile.getProfile()).then((p) => updateProfile(p)) },
              ])
            }
          />
        </ListGroup>
        <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: spacing.xl, paddingHorizontal: layout.gutter }}>
          Conceito independente, sem vínculo oficial. Nenhuma marca, foto ou dado oficial do clube é usado.
        </Text>
      </View>
    </Screen>
  );
}
