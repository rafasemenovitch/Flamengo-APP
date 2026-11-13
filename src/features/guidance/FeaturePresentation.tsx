import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  View,
  findNodeHandle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text, useTheme } from '@/design-system';
import { useAuth } from '@/features/auth/AuthProvider';
import type { RootScreenProps } from '@/navigation/types';
import { haptic } from '@/utils/haptics';
import { FEATURE_PRESENTATION } from './content';
import { FeatureExample } from './FeatureExamples';
import { recordGuidance } from './storage';

type FeaturePresentationProps = {
  onClose: () => void;
  onBack?: () => void;
  /** Integra os recursos aos passos das boas-vindas, inclusive ao voltar dos alertas. */
  flow?: {
    page: number;
    onPageChange: (page: number) => void;
    stepOffset: number;
    totalSteps: number;
  };
};

export function FeaturePresentation({ onClose, onBack, flow }: FeaturePresentationProps) {
  const { colors, spacing, layout } = useTheme();
  const { session } = useAuth();
  const owner = session?.user.id ?? 'visitor';
  const [localPage, setLocalPage] = useState(0);
  const page = flow?.page ?? localPage;
  const setPage = flow?.onPageChange ?? setLocalPage;
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const heading = useRef<ComponentRef<typeof View>>(null);
  const slide = FEATURE_PRESENTATION[page]!;
  const last = page === FEATURE_PRESENTATION.length - 1;
  const step = (flow?.stepOffset ?? 0) + page + 1;
  const totalSteps = flow?.totalSteps ?? FEATURE_PRESENTATION.length;

  useEffect(() => {
    void recordGuidance(owner, 'presentation', 'seen');
  }, [owner]);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    if (Platform.OS !== 'web') {
      const node = findNodeHandle(heading.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }
  }, [page]);

  const close = (completed = false) => {
    void recordGuidance(owner, 'presentation', completed ? 'completed' : 'dismissed');
    onClose();
  };
  const back = useCallback(() => {
    if (page) setPage(page - 1);
    else (onBack ?? onClose)();
  }, [page, setPage, onBack, onClose]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => subscription.remove();
  }, [back]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.lg }}
      >
        <View style={{ width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: layout.gutter,
              minHeight: 44,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              onPress={back}
              style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm }}
            >
              <Text variant="label">Voltar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={flow ? 'Pular recursos e ir para os alertas' : 'Pular apresentação'}
              onPress={() => close()}
              style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm }}
            >
              <Text variant="label" tone="secondary">
                Pular
              </Text>
            </Pressable>
          </View>
          <View
            style={{ paddingHorizontal: layout.gutter, paddingTop: spacing.xl, gap: spacing.lg, flex: 1 }}
          >
            <View
              ref={heading}
              accessible
              accessibilityRole="header"
              accessibilityLabel={slide.title}
              accessibilityLiveRegion="polite"
            >
              <Text variant="h1" accessible={false}>
                {slide.title}
              </Text>
            </View>
            <Text variant="callout" tone="secondary">
              {slide.body}
            </Text>
            <FeatureExample kind={slide.id} />
            <Text variant="bodyS" tone="secondary">
              {slide.note}
            </Text>
          </View>
          <View style={{ paddingHorizontal: layout.gutter, paddingTop: spacing.xl, gap: spacing.lg }}>
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={`${flow ? 'Passo' : 'Recurso'} ${step} de ${totalSteps}`}
              accessibilityValue={{ min: 1, max: totalSteps, now: step }}
              style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}
            >
              {Array.from({ length: totalSteps }, (_, index) => (
                <View
                  key={index}
                  style={{
                    height: 6,
                    width: index === step - 1 ? 22 : 6,
                    borderRadius: 3,
                    backgroundColor: index === step - 1 ? colors.primary : colors.borderStrong,
                  }}
                />
              ))}
            </View>
            <Button
              label={last ? (flow ? 'Continuar' : 'Concluir') : 'Próximo'}
              icon={last && !flow ? 'checkmark' : 'arrow-forward'}
              iconPosition="right"
              fullWidth
              onPress={() => {
                if (last) close(true);
                else {
                  haptic.select();
                  setPage(page + 1);
                }
              }}
            />
            <Button
              label={flow ? 'Pular recursos' : 'Encerrar apresentação'}
              variant="link"
              onPress={() => close()}
              style={{ alignSelf: 'center' }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function FeaturePresentationScreen({ navigation }: RootScreenProps<'FeaturePresentation'>) {
  return <FeaturePresentation onClose={() => navigation.goBack()} />;
}
