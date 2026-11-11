import { Ionicons } from '@expo/vector-icons';
import { StackActions, useNavigation } from '@react-navigation/native';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Switch, TextInput, View } from 'react-native';

import { Button, Screen, SectionTitle, Text, useTheme } from '@/design-system';
import type { RootScreenProps } from '@/navigation/types';
import { IS_DEMO, services } from '@/services';
import type { BolaoPreview, BolaoScope } from '@/types/bolao';
import { BOLAO_RULES, normalizeCode } from '@/utils/bolaoScoring';
import { SCOPE_LABEL } from './BolaoParts';

const SCOPES: BolaoScope[] = ['todos', 'brasileirao', 'libertadores', 'copa-do-brasil'];

function Keyboard({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgCanvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

/** Criar bolão: nome, quais jogos valem e se a entrada precisa de aprovação. */
export function BolaoCreateScreen() {
  const navigation = useNavigation();
  const { colors, fonts, layout, radius } = useTheme();
  const [name, setName] = useState('');
  const [scope, setScope] = useState<BolaoScope>('todos');
  const [approval, setApproval] = useState(true);
  const [saving, setSaving] = useState(false);
  const valid = name.trim().length >= 3;

  const create = async () => {
    setSaving(true);
    try {
      const pool = await services.bolao.createPool({ name, scope, requireApproval: approval });
      navigation.dispatch(StackActions.replace('BolaoPool', { poolId: pool.id, tab: 'convidar' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Keyboard>
      <Screen title="Criar bolão">
        <View style={{ paddingHorizontal: layout.gutter, gap: 8 }}>
          <Text variant="labelM" tone="secondary">
            Nome do bolão
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex.: Resenha do Maraca"
            placeholderTextColor={colors.inkTertiary}
            maxLength={32}
            autoFocus
            accessibilityLabel="Nome do bolão"
            style={{
              height: 56,
              borderRadius: radius.m,
              paddingHorizontal: 16,
              backgroundColor: colors.bgRaised,
              color: colors.inkPrimary,
              fontFamily: fonts.semibold,
              fontSize: 18,
            }}
          />
        </View>

        <View style={{ marginTop: 40 }}>
          <SectionTitle title="Quais jogos valem" />
          <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
            {SCOPES.map((s) => {
              const on = s === scope;
              return (
                <Pressable
                  key={s}
                  onPress={() => setScope(s)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    minHeight: 56,
                    paddingHorizontal: layout.gutter,
                    borderBottomWidth: 1,
                    borderColor: colors.lineHairline,
                    backgroundColor: pressed ? colors.bgRaised : 'transparent',
                  })}
                >
                  <Text variant="bodyL" tone={on ? 'primary' : 'secondary'} style={{ flex: 1 }}>
                    {SCOPE_LABEL[s]}
                  </Text>
                  <Ionicons
                    name={on ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={on ? colors.accentText : colors.inkTertiary}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View
          style={{
            marginTop: 40,
            marginHorizontal: layout.gutter,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="titleM">Aprovar quem entra</Text>
            <Text variant="bodyS" tone="secondary">
              Quem usar o código pede para entrar e você aprova.
            </Text>
          </View>
          <Switch
            value={approval}
            onValueChange={setApproval}
            accessibilityLabel="Aprovar quem entra"
            trackColor={{ true: colors.accent, false: colors.bgRaised2 }}
            thumbColor={colors.inkOnRed}
            ios_backgroundColor={colors.bgRaised2}
          />
        </View>

        <View style={{ paddingHorizontal: layout.gutter, marginTop: 40, gap: 16 }}>
          <Text variant="bodyS" tone="tertiary">
            Com {BOLAO_RULES.prizeMinMembers} ou mais participantes, o campeão do ano ganha{' '}
            {BOLAO_RULES.prizeDiscountPct}% de desconto num ingresso.
          </Text>
          <Button
            label="Criar e convidar amigos"
            onPress={create}
            loading={saving}
            disabled={!valid}
            fullWidth
          />
        </View>
        <View style={{ height: 32 }} />
      </Screen>
    </Keyboard>
  );
}

/** Entrar com código: procura o bolão, mostra quem administra e pede para entrar. */
export function BolaoJoinScreen({ route }: RootScreenProps<'BolaoJoin'>) {
  const navigation = useNavigation();
  const { colors, fonts, layout, radius } = useTheme();
  const [code, setCode] = useState(route.params?.code ?? '');
  const [searching, setSearching] = useState(false);
  const [preview, setPreview] = useState<BolaoPreview | null>();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<'pending' | 'member'>();
  const c = normalizeCode(code);

  const search = async () => {
    setSearching(true);
    setPreview(undefined);
    try {
      setPreview(await services.bolao.findPool(c));
    } finally {
      setSearching(false);
    }
  };
  const join = async () => {
    if (!preview) return;
    setSending(true);
    try {
      const pool = await services.bolao.requestJoin(preview.code);
      setSent(pool.status);
      if (pool.status === 'member')
        navigation.dispatch(StackActions.replace('BolaoPool', { poolId: pool.id }));
    } finally {
      setSending(false);
    }
  };

  if (sent === 'pending' && preview)
    return (
      <Screen title="Entrar no bolão">
        <View style={{ paddingHorizontal: layout.gutter, paddingTop: 48, alignItems: 'center', gap: 16 }}>
          <Ionicons name="hourglass-outline" size={48} color={colors.accentText} />
          <Text variant="headline" align="center">
            Pedido enviado
          </Text>
          <Text variant="bodyL" tone="secondary" align="center">
            Assim que {preview.adminName} aprovar, o bolão {preview.name} aparece em Meus bolões.
          </Text>
          <Button
            label="Voltar para o bolão"
            onPress={() => navigation.goBack()}
            fullWidth
            style={{ marginTop: 16 }}
          />
        </View>
      </Screen>
    );

  return (
    <Keyboard>
      <Screen title="Entrar no bolão">
        <View style={{ paddingHorizontal: layout.gutter, gap: 16 }}>
          <Text variant="bodyL" tone="secondary">
            Digite o código que seu amigo mandou. Também dá para colar o link do convite.
          </Text>
          <TextInput
            value={code}
            onChangeText={(t) => {
              setCode(t.toUpperCase());
              setPreview(undefined);
            }}
            onSubmitEditing={search}
            placeholder="CÓDIGO"
            placeholderTextColor={colors.inkTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
            accessibilityLabel="Código do bolão"
            style={{
              height: 72,
              borderRadius: radius.m,
              backgroundColor: colors.bgRaised,
              color: colors.inkPrimary,
              fontFamily: fonts.displayWide110,
              fontSize: 30,
              letterSpacing: 6,
              textAlign: 'center',
            }}
          />
          <Button
            label="Procurar bolão"
            onPress={search}
            loading={searching}
            disabled={c.length < 5}
            fullWidth
          />
          {IS_DEMO && (
            <Text variant="bodyS" tone="tertiary" align="center">
              Na demonstração, use NACAO26 (pede aprovação) ou FLA2026 (entrada livre).
            </Text>
          )}
        </View>

        {preview === null && (
          <View style={{ paddingHorizontal: layout.gutter, marginTop: 32, alignItems: 'center', gap: 8 }}>
            <Ionicons name="search-outline" size={32} color={colors.inkTertiary} />
            <Text variant="titleM">Nenhum bolão com esse código</Text>
            <Text variant="bodyM" tone="secondary" align="center">
              Confira as letras com quem te convidou.
            </Text>
          </View>
        )}

        {preview && (
          <View
            style={{
              marginTop: 32,
              marginHorizontal: layout.gutter,
              padding: 20,
              gap: 16,
              borderRadius: radius.l,
              backgroundColor: colors.bgRaised,
            }}
          >
            <View style={{ gap: 4 }}>
              <Text variant="headline">{preview.name}</Text>
              <Text variant="bodyM" tone="secondary">
                De {preview.adminName} · {preview.memberCount} participantes
              </Text>
              <Text variant="bodyM" tone="secondary">
                {SCOPE_LABEL[preview.scope]}
              </Text>
            </View>
            {preview.memberCount >= BOLAO_RULES.prizeMinMembers && (
              <Text variant="labelM" tone="brand">
                Vale {BOLAO_RULES.prizeDiscountPct}% off no ingresso para o campeão
              </Text>
            )}
            {preview.alreadyIn ? (
              <Text variant="bodyM" tone="secondary">
                Você já está neste bolão (ou já pediu para entrar).
              </Text>
            ) : (
              <Button
                label={preview.requireApproval ? 'Pedir para entrar' : 'Entrar no bolão'}
                onPress={join}
                loading={sending}
                fullWidth
              />
            )}
            {preview.requireApproval && !preview.alreadyIn && (
              <Text variant="bodyS" tone="tertiary">
                {preview.adminName} precisa aprovar sua entrada.
              </Text>
            )}
          </View>
        )}
        <View style={{ height: 32 }} />
      </Screen>
    </Keyboard>
  );
}
