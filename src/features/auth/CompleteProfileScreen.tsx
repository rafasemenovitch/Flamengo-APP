import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Button, Monogram, Text, useTheme } from '@/design-system';
import { useAuth } from './AuthProvider';
import { PersonalFields } from './PersonalFields';
import { emptyPersonalForm, parsePersonalForm, personalFormErrors, type PersonalForm } from './profileForm';

export function ProfileLoading() {
  const { colors } = useTheme();
  return (
    <View
      style={{ flex: 1, backgroundColor: colors.bgCanvas, justifyContent: 'center', alignItems: 'center' }}
    >
      <ActivityIndicator color={colors.accentText} accessibilityLabel="Carregando seu perfil" />
    </View>
  );
}

export function ProfileLoadError() {
  const { colors, spacing, layout } = useTheme();
  const { reloadProfile, signOut } = useAuth();
  const [error, setError] = useState('');
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bgCanvas,
        padding: layout.gutter,
        gap: spacing.lg,
        justifyContent: 'center',
      }}
    >
      <Text variant="displayM">Não foi possível carregar seu perfil</Text>
      <Text tone="secondary">Confira sua conexão e tente novamente.</Text>
      <Button label="Tentar novamente" fullWidth onPress={reloadProfile} />
      <Button
        label="Sair da conta"
        variant="secondary"
        fullWidth
        onPress={() => {
          signOut().catch(() => setError('Não foi possível sair. Tente novamente.'));
        }}
      />
      {!!error && <Text tone="danger">{error}</Text>}
    </View>
  );
}

export function CompleteProfileScreen({
  onContinue,
  initialForm = emptyPersonalForm,
}: {
  onContinue: () => void;
  initialForm?: PersonalForm;
}) {
  const { colors, spacing, layout } = useTheme();
  const { completeProfile, signOut } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    setTried(true);
    if (Object.keys(personalFormErrors(form)).length || busy) return;
    setBusy(true);
    setError('');
    try {
      await completeProfile(parsePersonalForm(form));
      onContinue();
    } catch {
      setError('Não foi possível salvar seu perfil. Confira sua conexão e tente novamente.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgCanvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: layout.gutter, paddingBottom: spacing.xxl }}
      >
        <View
          style={{ width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: spacing.xl }}
        >
          <Monogram width={56} />
          <View style={{ gap: spacing.sm }}>
            <Text variant="displayL" accessibilityRole="header">
              Complete seu cadastro
            </Text>
            <Text tone="secondary">
              Sua conta já está criada. Falta conhecer você para personalizar o aplicativo.
            </Text>
          </View>
          <PersonalFields value={form} onChange={setForm} disabled={busy} tried={tried} />
          {!!error && (
            <Text tone="danger" accessibilityRole="alert">
              {error}
            </Text>
          )}
          <Button label="Salvar e continuar" onPress={save} loading={busy} fullWidth />
          <Button
            label="Sair da conta"
            variant="link"
            disabled={busy}
            onPress={() => {
              signOut().catch(() => setError('Não foi possível sair. Tente novamente.'));
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
