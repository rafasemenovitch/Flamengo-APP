import { StyleSheet, View } from 'react-native';

import { DemoBadge, Monogram, Text, TreatedImage, useTheme } from '@/design-system';
import type { Membership, MembershipPlan } from '@/types/commerce';
import { formatFullDate } from '@/utils/format';
import { useAppState } from '@/state/AppStateProvider';

/** Mascara o número da carteirinha: só os 4 últimos dígitos visíveis. */
function mask(n: string) {
  const digits = n.replace(/\s/g, '');
  return `•••• •••• ${digits.slice(-4)}`;
}

/**
 * Carteirinha de sócio (especificação 12.11): proporção de cartão, fundo
 * vermelho com textura de foto tratada a 20%, selo DEMO.
 */
export function MemberCard({ membership, plan }: { membership: Membership; plan: MembershipPlan }) {
  const { colors, radius } = useTheme();
  const { profile } = useAppState();
  const holderName = membership.isDemo ? (profile?.name ?? membership.holderName) : membership.holderName;
  return (
    <View
      accessible
      accessibilityLabel={`Carteirinha demonstrativa, plano ${plan.name}, ${holderName}`}
      style={{
        aspectRatio: 1.586,
        borderRadius: radius.l,
        overflow: 'hidden',
        backgroundColor: colors.bgRed,
      }}
    >
      <TreatedImage
        imageKey="member-card"
        aspect="wide"
        style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}
      />
      <Monogram
        color="white"
        width={240}
        opacity={0.12}
        style={{ position: 'absolute', right: -56, bottom: -48 }}
      />
      <View style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text variant="displayM" tone="onPrimary" style={{ flex: 1 }} numberOfLines={2}>
            {plan.name}
          </Text>
          <DemoBadge />
        </View>
        <View style={{ gap: 4 }}>
          <Text variant="titleM" tone="onPrimary">
            {holderName}
          </Text>
          <Text variant="numericTable" tone="onPrimary" style={{ letterSpacing: 2 }}>
            {mask(membership.memberNumber)}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Text variant="bodyS" tone="onPrimary" style={{ opacity: 0.85 }}>
              Válida até {formatFullDate(membership.validUntil)}
            </Text>
            <Monogram color="white" width={28} />
          </View>
        </View>
      </View>
    </View>
  );
}
