import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, View } from 'react-native';

import {
  Badge,
  Button,
  ErrorState,
  ListGroup,
  ListItem,
  Screen,
  SectionTitle,
  Skeleton,
  Text,
  useTheme,
} from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { formatCurrency, formatNumber } from '@/utils/format';
import { MemberCard } from './MemberCard';

/** Sócio-Torcedor: carteirinha, programa e planos (valores de referência reais). */
export function MembershipScreen() {
  const { colors, layout, radius } = useTheme();
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
        <View style={{ padding: layout.gutter, gap: 16 }}>
          <Skeleton height={210} radius={radius.l} />
          <Skeleton height={300} radius={8} />
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
      {m && plan && (
        <View style={{ paddingHorizontal: layout.gutter, gap: 24 }}>
          <MemberCard membership={m} plan={plan} />
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1 }}>
              <Text variant="displayXl">{formatNumber(m.priorityPoints)}</Text>
              <Text variant="bodyS" tone="secondary">
                pontos de prioridade
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="displayXl" tone="success">
                {plan.ticketDiscountPct}%
              </Text>
              <Text variant="bodyS" tone="secondary">
                sobre a inteira
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ marginTop: 48 }}>
        <SectionTitle title={`Programa ${info.name}`} subtitle="Como funciona" />
        <ListGroup>
          {benefits.map((b) => (
            <ListItem key={b.id} title={b.title} subtitle={b.description} />
          ))}
        </ListGroup>
      </View>

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Planos" subtitle="Valores mensais de referência" />
        <View style={{ paddingHorizontal: layout.gutter, gap: 12 }}>
          {plans.map((p) => {
            const current = p.id === plan?.id;
            return (
              <View
                key={p.id}
                style={{
                  backgroundColor: colors.bgRaised,
                  borderRadius: radius.l,
                  padding: 20,
                  gap: 12,
                  borderWidth: current ? 1.5 : 0,
                  borderColor: colors.lineStrong,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="displayM" style={{ flex: 1 }}>
                    {p.name}
                  </Text>
                  {current ? (
                    <Badge label="Seu plano" />
                  ) : p.priceIsEstimate ? (
                    <Badge label="Estimado" tone="warning" />
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text variant="displayS">{formatCurrency(p.monthlyPrice)}</Text>
                  <Text variant="bodyS" tone="secondary">
                    /mês
                  </Text>
                </View>
                {p.audience && (
                  <Text variant="bodyS" tone="secondary">
                    {p.audience}
                  </Text>
                )}
                <View style={{ gap: 6 }}>
                  {p.benefits.map((b) => (
                    <View key={b} style={{ flexDirection: 'row', gap: 8 }}>
                      <Ionicons name="checkmark" size={16} color={colors.success} style={{ marginTop: 3 }} />
                      <Text variant="bodyM" style={{ flex: 1 }}>
                        {b}
                      </Text>
                    </View>
                  ))}
                </View>
                {p.guests && (
                  <Text variant="bodyS" tone="tertiary">
                    Convidados: {p.guests}
                  </Text>
                )}
                {!current && (
                  <Button
                    label={`Mudar para ${p.name.replace('Nação ', '')}`}
                    variant="secondary"
                    size="sm"
                    onPress={() =>
                      Alert.alert(
                        'Demonstração',
                        'A troca de plano é apenas ilustrativa nesta versão. Nenhuma cobrança será feita.'
                      )
                    }
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ paddingHorizontal: layout.gutter, marginTop: 32, gap: 8 }}>
        <Text variant="bodyS" tone="secondary">
          {info.priceNote}
        </Text>
        <Text variant="bodyS" tone="tertiary">
          Fontes: {info.sources.join(' · ')}
        </Text>
        <Button
          label="Conferir no site oficial"
          variant="link"
          icon="open-outline"
          onPress={() => Linking.openURL(info.officialUrl).catch(() => undefined)}
        />
      </View>
    </Screen>
  );
}
