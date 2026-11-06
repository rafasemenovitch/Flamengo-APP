import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, Card, IconButton, palette, Screen, Text, useTheme } from '@/design-system';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { haptic } from '@/utils/haptics';

type Step = 'intro' | 'camera' | 'review' | 'done';

/**
 * Cadastro facial para entrada no estádio. Vinculado à CONTA: vale para
 * todos os ingressos. No modo demo a foto não sai do aparelho.
 */
export function FaceEnrollmentScreen({ navigation }: RootScreenProps<'FaceEnrollment'>) {
  const { colors, spacing, layout, radius } = useTheme();
  const [step, setStep] = useState<Step>('intro');
  const [consent, setConsent] = useState(false);
  const [photo, setPhoto] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);

  const start = async () => {
    const p = permission?.granted ? permission : await requestPermission();
    if (p.granted) setStep('camera');
  };

  const capture = async () => {
    haptic.medium();
    const pic = await camera.current?.takePictureAsync({ quality: 0.5, skipProcessing: true });
    if (pic?.uri) {
      setPhoto(pic.uri);
      setStep('review');
    }
  };

  const confirm = async () => {
    if (!photo) return;
    setSaving(true);
    try {
      await services.profile.enrollFace(photo);
      haptic.success();
      setStep('done');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'camera') {
    return (
      <View style={{ flex: 1, backgroundColor: palette.black }}>
        <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" />
        {/* Guia oval */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ width: 250, height: 330, borderRadius: 165, borderWidth: 3, borderColor: palette.white, borderStyle: 'dashed' }} />
        </View>
        <SafeAreaView style={{ flex: 1, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.sm }}>
            <IconButton icon="close" variant="onMedia" accessibilityLabel="Cancelar" onPress={() => setStep('intro')} />
            <Badge label="Demo" tone="demo" />
          </View>
          <View style={{ alignItems: 'center', gap: spacing.lg, paddingBottom: spacing.xl }}>
            <Text variant="bodyStrong" tone="onMedia" align="center" style={{ paddingHorizontal: layout.gutter }}>
              Centralize o rosto no contorno, sem boné nem óculos escuros, em local iluminado.
            </Text>
            <Pressable
              onPress={capture}
              accessibilityRole="button"
              accessibilityLabel="Tirar foto"
              style={({ pressed }) => ({ width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: palette.white, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: palette.white }} />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <Screen title="Acesso por reconhecimento facial">
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.lg }}>
        {step === 'intro' && (
          <>
            <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.md }}>
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySubtle, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="scan" size={48} color={colors.primaryText} />
              </View>
              <Text variant="h1" align="center">Entre no Maracanã com o seu rosto</Text>
              <Text variant="body" tone="secondary" align="center">
                O acesso ao estádio é feito por reconhecimento facial. Cadastre seu rosto uma vez e ele fica vinculado à sua conta: na catraca, a leitura confirma seu ingresso.
              </Text>
            </View>
            <Card>
              <View style={{ gap: spacing.md }}>
                {[
                  ['person-circle', 'Uma foto de frente, sem acessórios no rosto'],
                  ['ticket', 'Vale para todos os seus ingressos'],
                  ['people', 'Convidados fazem o próprio cadastro'],
                ].map(([icon, label]) => (
                  <View key={label} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                    <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primaryText} />
                    <Text variant="callout" style={{ flex: 1 }}>{label}</Text>
                  </View>
                ))}
              </View>
            </Card>
            <Pressable
              onPress={() => setConsent((c) => !c)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consent }}
              style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: consent ? colors.primary : colors.border }}
            >
              <Ionicons name={consent ? 'checkbox' : 'square-outline'} size={22} color={consent ? colors.primaryText : colors.textTertiary} />
              <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
                Autorizo o uso da minha imagem facial, um dado biométrico sensível, exclusivamente para controle de acesso ao estádio, conforme a LGPD. Posso revogar quando quiser.
              </Text>
            </Pressable>
            {permission && !permission.granted && !permission.canAskAgain && (
              <Button label="Liberar câmera nos ajustes" variant="ghost" icon="settings-outline" onPress={() => Linking.openSettings()} />
            )}
            <Button label="Cadastrar meu rosto" icon="camera" disabled={!consent} onPress={start} fullWidth />
            <Text variant="footnote" tone="demo" align="center">Demonstração: a foto não sai do seu celular e não é enviada a nenhum sistema.</Text>
          </>
        )}

        {step === 'review' && photo && (
          <>
            <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.md }}>
              <Image source={{ uri: photo }} style={{ width: 220, height: 290, borderRadius: 110, borderWidth: 3, borderColor: colors.primary, transform: [{ scaleX: -1 }] }} accessibilityLabel="Sua foto" />
              <Text variant="h2" align="center">Ficou boa?</Text>
              <Text variant="callout" tone="secondary" align="center">Rosto inteiro visível, de frente e bem iluminado.</Text>
            </View>
            <Button label="Usar esta foto" icon="checkmark" loading={saving} onPress={confirm} fullWidth />
            <Button label="Tirar outra" variant="secondary" icon="refresh" onPress={() => setStep('camera')} fullWidth />
          </>
        )}

        {step === 'done' && (
          <View style={{ alignItems: 'center', gap: spacing.lg, paddingTop: spacing.xxl }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.successSubtle, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="checkmark" size={52} color={colors.success} />
            </View>
            <Text variant="h1" align="center">Rosto cadastrado!</Text>
            <Text variant="body" tone="secondary" align="center">No dia do jogo, é só olhar para a câmera da catraca do seu portão.</Text>
            <Badge label="Cadastro demonstrativo" tone="demo" icon="flask-outline" />
            <Button label="Voltar ao ingresso" onPress={() => navigation.goBack()} fullWidth />
          </View>
        )}
      </View>
    </Screen>
  );
}
