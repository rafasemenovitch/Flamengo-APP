import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import {
  Avatar,
  Button,
  ListGroup,
  ListItem,
  Screen,
  SectionTitle,
  Text,
  useAlerts,
  useTheme,
} from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { FanProfile, Gender } from '@/types/fan';
import { formatFullDate } from '@/utils/format';

const digits = (v: string) => v.replace(/\D/g, '');
const maskCpf = (v: string) =>
  digits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
const maskPhone = (v: string) => {
  const d = digits(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const maskCep = (v: string) =>
  digits(v)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');
const maskDate = (v: string) =>
  digits(v)
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
const isoToBr = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '');
const brToIso = (br: string) => {
  const [d, m, y] = br.split('/');
  return d && m && y && y.length === 4 ? `${y}-${m}-${d}` : '';
};

/** Dígitos verificadores do CPF. */
function validCpf(v: string) {
  const d = digits(v);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const check = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return check(9) === Number(d[9]) && check(10) === Number(d[10]);
}

const GENDERS: [Gender, string][] = [
  ['masculino', 'Masculino'],
  ['feminino', 'Feminino'],
  ['outro', 'Outro'],
  ['nao-informar', 'Prefiro não dizer'],
];

function Field({
  label,
  value,
  onChange,
  error,
  keyboardType,
  placeholder,
  autoCapitalize = 'sentences',
  flex,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  flex?: number;
}) {
  const { colors, fonts, radius } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6, flex }}>
      <Text variant="labelM" tone="secondary">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        accessibilityLabel={label}
        keyboardType={keyboardType}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={colors.inkTertiary}
        style={{
          height: 52,
          borderRadius: radius.m,
          paddingHorizontal: 16,
          backgroundColor: colors.bgRaised,
          borderWidth: 1,
          borderColor: error ? colors.danger : focus ? colors.lineStrong : 'transparent',
          color: colors.inkPrimary,
          fontFamily: fonts.regular,
          fontSize: 16,
        }}
      />
      {error && (
        <Text variant="bodyS" tone="danger">
          {error}
        </Text>
      )}
    </View>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const { layout } = useTheme();
  return (
    <View style={{ marginTop: 40 }}>
      <SectionTitle title={title} />
      <View style={{ paddingHorizontal: layout.gutter, gap: 16 }}>{children}</View>
    </View>
  );
}

type Form = Omit<
  FanProfile,
  'favoritePlayerIds' | 'interests' | 'notifications' | 'privacy' | 'id' | 'fanSince'
> & {
  fanSince: string;
};

/** Editar perfil: os dados que o clube pede para ingresso, sócio e entrada no estádio. */
export function EditProfileScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { colors, layout } = useTheme();
  const { profile, updateProfile } = useAppState();
  const { showToast } = useAlerts();
  const face = useAsync(() => services.profile.getFaceEnrollment(), [isFocused]);
  const [f, setF] = useState<Form | undefined>(() =>
    profile
      ? { ...profile, birthDate: isoToBr(profile.birthDate), fanSince: String(profile.fanSince) }
      : undefined
  );
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  if (!profile || !f) return <Screen title="Editar perfil">{null}</Screen>;

  const set =
    <K extends keyof Form>(k: K) =>
    (v: Form[K]) =>
      setF({ ...f, [k]: v });
  const errors: Partial<Record<keyof Form, string>> = {};
  if (f.name.trim().split(' ').length < 2) errors.name = 'Informe nome e sobrenome.';
  if (!validCpf(f.cpf)) errors.cpf = 'CPF inválido.';
  if (!brToIso(f.birthDate)) errors.birthDate = 'Use o formato DD/MM/AAAA.';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) errors.email = 'E-mail inválido.';
  if (digits(f.phone).length < 10) errors.phone = 'Celular com DDD.';
  if (digits(f.cep).length !== 8) errors.cep = 'CEP com 8 números.';
  const err = (k: keyof Form) => (tried ? errors[k] : undefined);
  const enrolled = face.data?.status === 'enrolled';

  const save = async () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    setSaving(true);
    try {
      await updateProfile({
        ...f,
        name: f.name.trim(),
        firstName: f.firstName.trim() || (f.name.trim().split(' ')[0] ?? ''),
        birthDate: brToIso(f.birthDate),
        fanSince: Number(f.fanSince) || profile.fanSince,
      });
      showToast('Dados salvos.');
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgCanvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen title="Editar perfil">
        <View style={{ alignItems: 'center', gap: 12, paddingTop: 8 }}>
          <Avatar name={f.name} size={96} />
          <Pressable
            accessibilityRole="button"
            onPress={() => showToast('Troca de foto chega com o login real.')}
            hitSlop={8}
          >
            <Text variant="labelM" tone="brand">
              Alterar foto
            </Text>
          </Pressable>
        </View>

        <Group title="Dados pessoais">
          <Field
            label="Nome completo"
            value={f.name}
            onChange={set('name')}
            autoCapitalize="words"
            error={err('name')}
          />
          <Field
            label="Como quer ser chamado"
            value={f.firstName}
            onChange={set('firstName')}
            autoCapitalize="words"
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Field
              flex={1.2}
              label="CPF"
              value={f.cpf}
              onChange={(v) => set('cpf')(maskCpf(v))}
              keyboardType="number-pad"
              error={err('cpf')}
            />
            <Field
              flex={1}
              label="Nascimento"
              value={f.birthDate}
              onChange={(v) => set('birthDate')(maskDate(v))}
              keyboardType="number-pad"
              placeholder="DD/MM/AAAA"
              error={err('birthDate')}
            />
          </View>
          <View style={{ gap: 8 }}>
            <Text variant="labelM" tone="secondary">
              Gênero
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {GENDERS.map(([k, label]) => {
                const on = f.gender === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => set('gender')(k)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    style={{
                      height: 40,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                      justifyContent: 'center',
                      backgroundColor: on ? colors.inkPrimary : 'transparent',
                      borderWidth: on ? 0 : 1,
                      borderColor: colors.lineHairline,
                    }}
                  >
                    <Text variant="labelM" style={{ color: on ? colors.bgCanvas : colors.inkSecondary }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Field
            label="Rubro-negro desde"
            value={f.fanSince}
            onChange={(v) => set('fanSince')(digits(v).slice(0, 4))}
            keyboardType="number-pad"
          />
        </Group>

        <Group title="Contato">
          <Field
            label="E-mail"
            value={f.email}
            onChange={set('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            error={err('email')}
          />
          <Field
            label="Celular"
            value={f.phone}
            onChange={(v) => set('phone')(maskPhone(v))}
            keyboardType="phone-pad"
            error={err('phone')}
          />
        </Group>

        <Group title="Endereço">
          <Field
            label="CEP"
            value={f.cep}
            onChange={(v) => set('cep')(maskCep(v))}
            keyboardType="number-pad"
            error={err('cep')}
          />
          <Field label="Rua" value={f.street} onChange={set('street')} autoCapitalize="words" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Field
              flex={1}
              label="Número"
              value={f.number}
              onChange={set('number')}
              keyboardType="number-pad"
            />
            <Field flex={1.6} label="Complemento" value={f.complement} onChange={set('complement')} />
          </View>
          <Field
            label="Bairro"
            value={f.neighborhood}
            onChange={set('neighborhood')}
            autoCapitalize="words"
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Field flex={2} label="Cidade" value={f.city} onChange={set('city')} autoCapitalize="words" />
            <Field
              flex={1}
              label="UF"
              value={f.state}
              onChange={(v) => set('state')(v.toUpperCase().slice(0, 2))}
              autoCapitalize="characters"
            />
          </View>
        </Group>

        <View style={{ marginTop: 40 }}>
          <SectionTitle title="Entrada no estádio" />
          <ListGroup>
            <ListItem
              icon="scan-outline"
              title="Cadastro facial"
              subtitle={
                enrolled && face.data?.enrolledAt
                  ? `Ativo desde ${formatFullDate(face.data.enrolledAt)}`
                  : 'Obrigatório para entrar no Maracanã'
              }
              trailing={
                enrolled ? undefined : (
                  <Text variant="labelM" tone="brand">
                    Cadastrar
                  </Text>
                )
              }
              onPress={() => navigation.navigate('FaceEnrollment')}
            />
          </ListGroup>
        </View>

        <View style={{ paddingHorizontal: layout.gutter, marginTop: 40, gap: 12 }}>
          {tried && Object.keys(errors).length > 0 && (
            <Text variant="bodyS" tone="danger" align="center">
              Confira os campos marcados.
            </Text>
          )}
          <Button label="Salvar" onPress={save} loading={saving} fullWidth />
          <Text variant="bodyS" tone="tertiary" align="center">
            CPF e nascimento são exigidos para ingresso nominal e meia-entrada.
          </Text>
        </View>
        <View style={{ height: 32 }} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
