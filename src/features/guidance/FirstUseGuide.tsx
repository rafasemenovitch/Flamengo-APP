import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';

import { Button, Text, useTheme } from '@/design-system';
import { useAuth } from '@/features/auth/AuthProvider';
import { RESOURCE_GUIDES, type GuidedResource } from './content';
import { claimFirstVisit, guidanceKey, recordGuidance, type GuidanceStatus } from './storage';

/** Orientação no fluxo da tela: sem modal, backdrop, permissões ou navegação automática. */
export function FirstUseGuide({
  resource,
  enabled = true,
  constrained = false,
}: {
  resource: GuidedResource;
  enabled?: boolean;
  constrained?: boolean;
}) {
  const { session } = useAuth();
  const owner = session?.user.id ?? 'visitor';
  const key = guidanceKey(owner, resource);
  const focused = useIsFocused();
  const { colors, spacing, layout } = useTheme();
  const { height } = useWindowDimensions();
  const [visibleKey, setVisibleKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!focused || !enabled) return;
    claimFirstVisit(owner, resource).then((first) => {
      if (active) setVisibleKey(first ? key : null);
    });
    return () => {
      active = false;
      setVisibleKey((current) => (current === key ? null : current));
    };
  }, [focused, enabled, owner, resource, key]);

  if (!focused || !enabled || visibleKey !== key) return null;
  const guide = RESOURCE_GUIDES[resource];
  const finish = (status: GuidanceStatus) => {
    setVisibleKey(null);
    void recordGuidance(owner, resource, status);
  };

  const content = (
    <View
      testID={`first-use-${resource}`}
      style={{
        paddingHorizontal: layout.gutter,
        paddingVertical: spacing.lg,
        gap: spacing.md,
        borderBottomWidth: 1,
        borderColor: colors.lineHairline,
      }}
    >
      <Text variant="overline" tone="brand">
        Primeiro uso
      </Text>
      <Text variant="titleM" accessibilityRole="header">
        {guide.title}
      </Text>
      {guide.steps.map((step, index) => (
        <View key={step} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
          <Text
            variant="labelM"
            tone="brand"
            style={{ paddingTop: spacing.xxs }}
            accessibilityLabel={`Passo ${index + 1}`}
          >
            {index + 1}
          </Text>
          <Text variant="bodyS" tone="secondary" style={{ flex: 1 }}>
            {step}
          </Text>
        </View>
      ))}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <Button label="Entendi" variant="secondary" size="sm" onPress={() => finish('completed')} />
        <Button label="Agora não" variant="link" onPress={() => finish('dismissed')} />
      </View>
    </View>
  );

  // Telas com cabeçalho e controles fixos reservam espaço para o próprio recurso.
  return constrained ? (
    <ScrollView nestedScrollEnabled style={{ maxHeight: height * 0.5, flexGrow: 0, flexShrink: 0 }}>
      {content}
    </ScrollView>
  ) : (
    content
  );
}
