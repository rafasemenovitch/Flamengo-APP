import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  Button,
  Card,
  DemoBadge,
  ErrorState,
  Screen,
  SegmentedControl,
  Skeleton,
  Text,
  useTheme,
} from '@/design-system';
import { MatchRow } from '@/features/shared/MatchUI';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import type { SectorOffer, TicketType } from '@/types/tickets';
import { formatCurrency } from '@/utils/format';
import { StadiumMap } from '@/features/stadium/StadiumMap';

const AVAIL = {
  available: ['Disponível', 'success'],
  'few-left': ['Últimos lugares', 'warning'],
  'sold-out': ['Esgotado', 'danger'],
} as const;

const priceOf = (s: SectorOffer, t: TicketType) =>
  t === 'full' ? s.priceFull : t === 'half' ? s.priceHalf : s.priceMember;

/** Compra SIMULADA: setor → tipo → quantidade → "Compra simulada". Nunca pede dados de pagamento. */
export function TicketPurchaseScreen({ route }: RootScreenProps<'TicketPurchase'>) {
  const { matchId } = route.params;
  const navigation = useNavigation();
  const { colors, spacing, layout, radius } = useTheme();
  const data = useAsync(async () => {
    const [match, sale, stadium] = await Promise.all([
      services.matches.getMatch(matchId),
      services.tickets.getSale(matchId),
      services.stadium.getStadium(),
    ]);
    return { match, sale, stadium };
  }, [matchId]);
  const [sectorId, setSectorId] = useState<string>();
  const [type, setType] = useState<TicketType>('member');
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);

  if (data.loading)
    return (
      <Screen title="Comprar ingresso">
        <View style={{ padding: layout.gutter, gap: spacing.md }}>
          <Skeleton height={140} />
          <Skeleton height={300} />
        </View>
      </Screen>
    );
  if (data.error || !data.data)
    return (
      <Screen title="Comprar ingresso" scroll={false}>
        <ErrorState onRetry={data.reload} />
      </Screen>
    );

  const { match, sale, stadium } = data.data;
  const sector = sale.sectors.find((s) => s.sectorId === sectorId);
  const total = sector ? priceOf(sector, type) * qty : 0;

  const buy = async () => {
    if (!sector) return;
    setBuying(true);
    try {
      const res = await services.tickets.purchase({
        matchId,
        sectorId: sector.sectorId,
        type,
        quantity: qty,
      });
      navigation.navigate('CheckoutResult', { orderId: res.orderId, total: res.total, kind: 'tickets' });
    } catch (e) {
      Alert.alert('Não foi possível concluir', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setBuying(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen title="Comprar ingresso" headerRight={<DemoBadge />}>
        <View style={{ paddingHorizontal: layout.gutter, gap: spacing.lg, paddingBottom: 120 }}>
          <MatchRow match={match} />

          <Card padding="sm">
            <StadiumMap
              stadium={stadium}
              highlightSectorId={sectorId}
              onSectorPress={(id) =>
                sale.sectors.find((s) => s.sectorId === id && s.availability !== 'sold-out') &&
                setSectorId(id)
              }
              height={240}
            />
            <Text variant="footnote" tone="tertiary" align="center">
              Toque num setor do mapa ou escolha na lista · esquema ilustrativo
            </Text>
          </Card>

          <Text variant="h3">Setor</Text>
          <View style={{ gap: spacing.sm }}>
            {sale.sectors.map((s) => {
              const selected = s.sectorId === sectorId;
              const soldOut = s.availability === 'sold-out';
              const [label, tone] = AVAIL[s.availability];
              return (
                <Pressable
                  key={s.sectorId}
                  disabled={soldOut}
                  onPress={() => setSectorId(s.sectorId)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: soldOut }}
                  accessibilityLabel={`${s.name}, portão ${s.gate}, a partir de ${formatCurrency(s.priceMember)}, ${label}`}
                  style={({ pressed }) => [
                    styles.sector,
                    {
                      borderRadius: radius.md,
                      padding: spacing.md,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primarySubtle : colors.surface,
                      opacity: soldOut ? 0.5 : pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selected ? colors.primaryText : colors.textTertiary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{s.name}</Text>
                    <Text variant="caption" tone="secondary">
                      Portão {s.gate} · sócio {formatCurrency(s.priceMember)} · inteira{' '}
                      {formatCurrency(s.priceFull)}
                    </Text>
                  </View>
                  <Badge label={label} tone={tone} />
                </Pressable>
              );
            })}
          </View>

          <Text variant="h3">Tipo de ingresso</Text>
          <View style={{ marginHorizontal: -layout.gutter }}>
            <SegmentedControl<TicketType>
              segments={[
                { key: 'member', label: 'Sócio' },
                { key: 'full', label: 'Inteira' },
                { key: 'half', label: 'Meia-entrada' },
              ]}
              value={type}
              onChange={setType}
            />
          </View>
          {type === 'half' && (
            <Text variant="caption" tone="secondary">
              Apresente o documento que comprova o direito à meia na entrada.
            </Text>
          )}

          <View style={[styles.between]}>
            <Text variant="h3">Quantidade</Text>
            <View style={[styles.row, { gap: spacing.md }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Diminuir quantidade"
                onPress={() => setQty((q) => Math.max(1, q - 1))}
                style={[styles.qtyBtn, { backgroundColor: colors.surfaceMuted }]}
              >
                <Ionicons name="remove" size={20} color={colors.textPrimary} />
              </Pressable>
              <Text variant="number">{qty}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Aumentar quantidade"
                onPress={() => setQty((q) => Math.min(sale.maxPerFan, q + 1))}
                style={[styles.qtyBtn, { backgroundColor: colors.surfaceMuted }]}
              >
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>
          <Text variant="footnote" tone="tertiary">
            Limite de {sale.maxPerFan} ingressos por torcedor.
          </Text>
        </View>
      </Screen>

      <SafeAreaView
        edges={['bottom']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.surfaceElevated,
          borderTopWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={[styles.row, { padding: layout.gutter, gap: spacing.lg }]}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" tone="secondary">
              Total (simulado)
            </Text>
            <Text variant="number">{formatCurrency(total)}</Text>
          </View>
          <Button
            label={sector ? 'Confirmar compra' : 'Escolha um setor'}
            disabled={!sector}
            loading={buying}
            onPress={buy}
            icon="lock-closed"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sector: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, minHeight: 56 },
  qtyBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
