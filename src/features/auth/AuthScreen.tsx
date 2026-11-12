import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Button, Monogram, Text, useTheme } from '@/design-system';
import { isSupabaseConfigured, requireSupabase } from '@/services/supabase/client';
import { authErrorMessage } from './authErrors';
import { useAuth } from './AuthProvider';
import { AuthField } from './AuthField';
import { PersonalFields } from './PersonalFields';
import { CompleteProfileScreen, ProfileLoading, ProfileLoadError } from './CompleteProfileScreen';
import { emptyPersonalForm, personalFormErrors, parsePersonalForm } from './profileForm';
import { createFanProfile } from '@/services/supabase/profiles';

type Mode = 'sign-in' | 'sign-up' | 'confirm-email';

export function AuthScreen({ onContinue, onBack }: { onContinue: () => void; onBack?: () => void }) {
  const { colors, spacing, layout } = useTheme();
  const {
    session,
    enterAsGuest,
    register,
    accountProfile,
    profileLoading,
    profileError,
    registering,
    reloadProfile,
  } = useAuth();
  const [personal, setPersonal] = useState(emptyPersonalForm);
  const [personalTried, setPersonalTried] = useState(false);
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [canConfirm, setCanConfirm] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [mode]);

  const changeMode = (next: Mode) => {
    setMode(next);
    setError('');
    setNotice('');
    setPassword('');
    setConfirmation('');
    setCode('');
    setCanConfirm(false);
  };

  const submit = async () => {
    if (busy) return;
    setError('');
    setNotice('');
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (mode !== 'confirm-email' && !password) {
      setError('Informe sua senha.');
      return;
    }
    if (mode === 'sign-up' && password.length < 8) {
      setError('Sua senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (mode === 'sign-up' && password !== confirmation) {
      setError('As senhas precisam ser iguais.');
      return;
    }
    if (mode === 'sign-up') {
      setPersonalTried(true);
      if (Object.keys(personalFormErrors(personal)).length) {
        setError('Confira seus dados pessoais acima.');
        return;
      }
    }
    if (mode === 'confirm-email' && !/^\d{6,8}$/.test(code.trim())) {
      setError('Digite o código recebido por e-mail.');
      return;
    }
    setBusy(true);
    try {
      const supabase = requireSupabase();
      if (mode === 'sign-up') {
        const createdSession = await register(address, password, parsePersonalForm(personal));
        setPassword('');
        setConfirmation('');
        if (createdSession) onContinue();
        else {
          setMode('confirm-email');
          setNotice('Enviamos um código para seu e-mail. Digite abaixo para confirmar a conta.');
        }
      } else if (mode === 'confirm-email') {
        const { data, error: authError } = await supabase.auth.verifyOtp({
          email: address,
          token: code.trim(),
          type: 'signup',
        });
        if (authError) throw authError;
        if (data.user && !Object.keys(personalFormErrors(personal)).length) {
          await createFanProfile(data.user, parsePersonalForm(personal));
          reloadProfile();
        }
        onContinue();
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: address, password });
        if (authError) {
          setCanConfirm(authError.code === 'email_not_confirmed');
          throw authError;
        }
        setPassword('');
        onContinue();
      }
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { error: authError } = await requireSupabase().auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      if (authError) throw authError;
      setMode('confirm-email');
      setPassword('');
      setNotice('Novo código enviado. Confira sua caixa de entrada e o spam.');
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const guest = async () => {
    setBusy(true);
    setError('');
    try {
      await enterAsGuest();
      onContinue();
    } catch {
      setError('Não foi possível continuar. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  if (session && !busy && !registering) {
    if (profileLoading) return <ProfileLoading />;
    if (profileError) return <ProfileLoadError />;
    if (!accountProfile) return <CompleteProfileScreen onContinue={onContinue} initialForm={personal} />;
  }
  const signedIn = !!session && !busy;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgCanvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, padding: layout.gutter, paddingBottom: spacing.xxl }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: layout.maxContentWidth,
            alignSelf: 'center',
            flex: 1,
            gap: spacing.xl,
          }}
        >
          {onBack && (
            <Button label="Voltar" variant="link" icon="arrow-back" onPress={onBack} disabled={busy} />
          )}
          <View style={{ gap: spacing.xl, paddingTop: onBack ? spacing.sm : spacing.xxl }}>
            <Monogram width={56} />
            <View style={{ gap: spacing.sm }}>
              <Text variant="displayL" accessibilityRole="header">
                {signedIn
                  ? 'Você está na Nação'
                  : mode === 'sign-up'
                    ? 'Faça parte da Nação'
                    : mode === 'confirm-email'
                      ? 'Confirme seu e-mail'
                      : 'Entre para a Nação'}
              </Text>
              <Text variant="bodyM" tone="secondary">
                {signedIn
                  ? session?.user.email
                  : mode === 'sign-up'
                    ? 'Crie sua conta para estar ainda mais perto do Mengão.'
                    : mode === 'confirm-email'
                      ? `Digite o código enviado para ${email.trim()}.`
                      : 'Acesse sua conta ou continue como visitante.'}
              </Text>
            </View>
          </View>

          {signedIn ? (
            <Button
              label="Continuar"
              icon="arrow-forward"
              iconPosition="right"
              fullWidth
              onPress={onContinue}
            />
          ) : (
            <>
              <View style={{ gap: spacing.lg }}>
                {!isSupabaseConfigured && (
                  <Text variant="bodyS" tone="secondary">
                    O acesso por conta estará disponível em breve. Por enquanto, entre como visitante.
                  </Text>
                )}
                {mode === 'confirm-email' ? (
                  <AuthField
                    label="Código de confirmação"
                    placeholder="Código do e-mail"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                    maxLength={8}
                    editable={!busy}
                    onSubmitEditing={submit}
                  />
                ) : (
                  <>
                    {mode === 'sign-up' && (
                      <PersonalFields
                        value={personal}
                        onChange={setPersonal}
                        disabled={busy}
                        tried={personalTried}
                      />
                    )}
                    <AuthField
                      label="E-mail"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      autoComplete="email"
                      editable={!busy}
                    />
                    <AuthField
                      label="Senha"
                      placeholder={mode === 'sign-up' ? 'Pelo menos 8 caracteres' : 'Sua senha'}
                      value={password}
                      onChangeText={setPassword}
                      password
                      editable={!busy}
                      textContentType={mode === 'sign-up' ? 'newPassword' : 'password'}
                      autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                      onSubmitEditing={submit}
                    />
                    {mode === 'sign-up' && (
                      <AuthField
                        label="Confirmar senha"
                        placeholder="Repita sua senha"
                        value={confirmation}
                        onChangeText={setConfirmation}
                        password
                        editable={!busy}
                        textContentType="newPassword"
                        autoComplete="new-password"
                        onSubmitEditing={submit}
                      />
                    )}
                  </>
                )}
                {!!error && (
                  <Text
                    variant="bodyS"
                    tone="danger"
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                  >
                    {error}
                  </Text>
                )}
                {!!notice && (
                  <Text variant="bodyS" tone="secondary" accessibilityLiveRegion="polite">
                    {notice}
                  </Text>
                )}
                <Button
                  label={
                    mode === 'sign-up'
                      ? 'Criar conta'
                      : mode === 'confirm-email'
                        ? 'Confirmar e entrar'
                        : 'Entrar'
                  }
                  icon="arrow-forward"
                  iconPosition="right"
                  fullWidth
                  loading={busy}
                  disabled={!isSupabaseConfigured}
                  onPress={submit}
                />
                {(mode === 'confirm-email' || canConfirm) && (
                  <Button
                    label="Enviar novo código"
                    variant="link"
                    onPress={resend}
                    disabled={busy || !isSupabaseConfigured}
                  />
                )}
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                }}
              >
                <Text variant="bodyS" tone="secondary">
                  {mode === 'sign-in' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}
                </Text>
                <Button
                  label={mode === 'sign-in' ? 'Criar conta' : 'Entrar'}
                  variant="link"
                  disabled={busy}
                  onPress={() => changeMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
                />
              </View>
              <View style={{ gap: spacing.lg, marginTop: 'auto' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ height: 1, backgroundColor: colors.lineHairline, flex: 1 }} />
                  <Text variant="bodyS" tone="tertiary">
                    ou
                  </Text>
                  <View style={{ height: 1, backgroundColor: colors.lineHairline, flex: 1 }} />
                </View>
                <Button
                  label="Entrar como visitante"
                  variant="secondary"
                  icon="person-outline"
                  fullWidth
                  disabled={busy}
                  onPress={guest}
                />
                <Text variant="bodyS" tone="secondary" align="center">
                  Você pode explorar o aplicativo sem criar uma conta.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
