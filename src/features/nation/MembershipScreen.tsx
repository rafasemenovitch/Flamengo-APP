import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Linking, StyleSheet, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  ClubCrest,
  DemoBadge,
  ErrorState,
  palette,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import type { MembershipPlan } from '@/types/commerce';
import { formatCurrency, formatFullDate, formatNumber } from '@/utils/format';

const TIER_GRADIENT: Record<MembershipPlan['tier'], readonly [string, string]> = {
  bronze: [palette.bronze, palette.ink900],
  silver: [palette.red700, palette.ink950],
  gold: [palette.gold, palette.red700],
  black: [palette.ink850, palette.black],
};

export function MembershipScreen() {
  const { colors, spacing, layout, radius } = useTheme();
  const q = useAsync(async () => {
    const [plans, membership, benefits, info] = await Promise.all([
      services.membership.getPlans(),
      services.membership.getMembership(),
      services.membership.getBenefits(),
      services.membership.getProgramInfo(),
    ]);
    return { plans, membership, benefits, info };
  });

  if (q.loading)
    return (
      <Screen title="Sócio-Torcedor">
        <View style={{ padding: layout.gutter, gap: spacing.lg }}>
          <Skeleton height={210} radius={radius.xl} />
          <Skeleton height={300} />
        </View>
      </Screen>
    );
  if (q.error || !q.data)
    return (
      <Screen title="Sócio-Torcedor" scroll={false}>
        <ErrorState onRetry={q.reload} />
      </Screen>
    );
  const { plans, membership: m, benefits, info } = q.data;
  const plan = plans.find((p) => p.id === m?.planId);

  return (
    <Screen title="Sócio-Torcedor" refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.lg }}>
        {m && plan && (
          <LinearGradient
            colors={TIER_GRADIENT[plan.tier]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: radius.xl,
              padding: spacing.xl,
              aspectRatio: 1.586,
              justifyContent: 'space-between',
            }}
          >
            <View style={styles.between}>
              <ClubCrest size={44} />
              <DemoBadge label="Carteirinha demo" />
            </View>
            <View style={{ gap: 2 }}>
              <Text variant="overline" tone="onMedia" style={{ opacity: 0.8 }}>
                Sócio-Torcedor · {plan.name}
              </Text>
              <Text variant="h2" tone="onMedia">
                {m.holderName}
              </Text>
              <Text variant="tabular" tone="onMedia" style={{ letterSpacing: 2 }}>
                {m.memberNumber}
              </Text>
            </View>
            <View style={styles.between}>
              <Text variant="footnote" tone="onMedia" style={{ opacity: 0.85 }}>
                Desde {formatFullDate(m.since)}
              </Text>
              <Text variant="footnote" tone="onMedia" style={{ opacity: 0.85 }}>
                Válida até {formatFullDate(m.validUntil)}
              </Text>
            </View>
          </LinearGradient>
        )}
        {m && (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Card style={{ flex: 1 }} padding="sm">
              <Text variant="number" align="center">
                {formatNumber(m.priorityPoints)}
              </Text>
              <Text variant="footnote" tone="secondary" align="center">
                Pontos de prioridade
              </Text>
            </Card>
            <Card style={{ flex: 1 }} padding="sm">
              <Text variant="number" align="center" tone="success">
                {m.status === 'active' ? 'Ativo' : 'Pendente'}
              </Text>
              <Text variant="footnote" tone="secondary" align="center">
                Situação
              </Text>
            </Card>
          </View>
        )}
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title={`Programa ${info.name}`} subtitle="Como funciona" />
        <View style={{ paddingHorizontal: layout.gutter, gap: spacing.sm }}>
          {benefits.map((b) => (
            <Card key={b.id} padding="sm">
              <View style={[styles.row, { gap: spacing.md }]}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: colors.primarySubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={
                      b.category === 'ingressos'
                        ? 'ticket'
                        : b.category === 'loja'
                          ? 'bag-handle'
                          : b.category === 'experiencias'
                            ? 'star'
                            : 'pricetag'
                    }
                    size={18}
                    color={colors.primaryText}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{b.title}</Text>
                  <Text variant="caption" tone="secondary">
                    {b.partner} · {b.description}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Planos" subtitle="Valores mensais de referência" />
        <View style={{ paddingHorizontal: layout.gutter, gap: spacing.md }}>
          {plans.map((p) => {
            const current = p.id === plan?.id;
            return (
              <Card key={p.id} variant={current ? 'tinted' : 'surface'} padding="lg">
                <View style={{ gap: spacing.md }}>
                  <View style={styles.between}>
                    <View style={[styles.row, { gap: spacing.sm }]}>
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor:
                            palette[p.tier === 'black' ? 'ink500' : p.tier === 'silver' ? 'silver' : p.tier],
                        }}
                      />
                      <Text variant="h2">{p.name}</Text>
                    </View>
                    {current ? (
                      <Badge label="Seu plano" tone="solidBrand" />
                    ) : p.highlight ? (
                      <Badge label={p.highlight} tone="brand" />
                    ) : null}
                  </View>
                  <View style={{ gap: 2 }}>
                    <View style={[styles.row, { gap: spacing.sm, alignItems: 'baseline' }]}>
                      <Text variant="number">
                        {formatCurrency(p.monthlyPrice)}
                        <Text variant="caption" tone="secondary">
                          /mês
                        </Text>
                      </Text>
                      {p.priceIsEstimate && <Badge label="Estimado" tone="warning" />}
                    </View>
                    {p.audience && (
                      <Text variant="caption" tone="secondary">
                        {p.audience}
                      </Text>
                    )}
                    <Text variant="caption" tone="secondary">
                      {p.ticketDiscountPct > 0 ? `${p.ticketDiscountPct}% sobre a inteira · ` : ''}Prioridade{' '}
                      {p.ticketPriority}
                      {p.guests ? ` · ${p.guests}` : ''}
                    </Text>
                  </View>
                  <View style={{ gap: 6 }}>
                    {p.benefits.map((b) => (
                      <View key={b} style={[styles.row, { gap: spacing.sm }]}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        <Text variant="callout" style={{ flex: 1 }}>
                          {b}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {!current && (
                    <Button
                      label={`Mudar para ${p.name}`}
                      variant="secondary"
                      onPress={() =>
                        Alert.alert(
                          'Demonstração',
                          'A troca de plano é apenas ilustrativa nesta versão. Nenhuma cobrança será feita.'
                        )
                      }
                    />
                  )}
                </View>
              </Card>
            );
          })}
          <Card variant="outline">
            <View style={{ gap: spacing.sm }}>
              <View style={[styles.row, { gap: spacing.sm }]}>
                <Ionicons name="information-circle" size={18} color={colors.info} />
                <Text variant="label" style={{ flex: 1 }}>
                  Sobre os valores
                </Text>
              </View>
              <Text variant="caption" tone="secondary">
                {info.priceNote}
              </Text>
              <Text variant="footnote" tone="tertiary">
                Fontes: {info.sources.join(' · ')}
              </Text>
              <Button
                label="Conferir no site oficial"
                variant="ghost"
                icon="open-outline"
                size="sm"
                onPress={() => Linking.openURL(info.officialUrl).catch(() => undefined)}
              />
            </View>
          </Card>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
