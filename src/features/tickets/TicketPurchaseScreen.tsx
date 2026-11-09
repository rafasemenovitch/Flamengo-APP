import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, DemoBadge, ErrorState, Filters, Screen, Skeleton, Text, useTheme } from '@/design-system';
import { StadiumMap } from '@/features/stadium/StadiumMap';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import type { SectorOffer, TicketType } from '@/types/tickets';
import { formatCurrency, formatMatchDate } from '@/utils/format';

const priceOf = (s: SectorOffer, t: TicketType) =>
  t === 'full' ? s.priceFull : t === 'half' ? s.priceHalf : s.priceMember;

/** Compra SIMULADA: setor (mapa ou lista) → tipo → quantidade → "Compra simulada". */
export function TicketPurchaseScreen({ route }: RootScreenProps<'TicketPurchase'>) {
  const { matchId } = route.params;
  const navigation = useNavigation();
  const { colors, layout, radius } = useTheme();
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
        <View style={{ padding: layout.gutter }}>
          <Skeleton height={360} radius={16} />
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
  const pick = (id: string) => {
    const s = sale.sectors.find((x) => x.sectorId === id);
    if (s && s.availability !== 'sold-out') setSectorId(id);
  };

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
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <Screen title="Comprar ingresso" headerRight={<DemoBadge />}>
        <View style={{ paddingHorizontal: layout.gutter, gap: 4 }}>
          <Text variant="displayM">
            {match.homeTeam.shortName} × {match.awayTeam.shortName}
          </Text>
          <Text variant="bodyS" tone="secondary">
            {formatMatchDate(match.kickoff)} · {match.venue.name}
          </Text>
        </View>

        <View style={{ marginTop: 16 }}>
          <StadiumMap stadium={stadium} highlightSectorId={sectorId} onSectorPress={pick} height={280} />
        </View>

        <View style={{ marginTop: 24, borderTopWidth: 1, borderColor: colors.lineHairline }}>
          {sale.sectors.map((s) => {
            const selected = s.sectorId === sectorId;
            const soldOut = s.availability === 'sold-out';
            return (
              <Pressable
                key={s.sectorId}
                disabled={soldOut}
                onPress={() => pick(s.sectorId)}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: soldOut }}
                accessibilityLabel={`${s.name}, ${soldOut ? 'esgotado' : formatCurrency(priceOf(s, type))}`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  minHeight: 56,
                  paddingHorizontal: layout.gutter,
                  borderBottomWidth: 1,
                  borderColor: colors.lineHairline,
                  opacity: soldOut ? 0.4 : pressed ? 0.7 : 1,
                })}
              >
                {selected && (
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 10,
                      bottom: 10,
                      width: 3,
                      backgroundColor: colors.accent,
                    }}
                  />
                )}
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selected ? colors.accentText : colors.inkTertiary}
                />
                <Text variant="titleS" style={{ flex: 1 }}>
                  {s.name}
                </Text>
                <Text variant="numericTable" tone={soldOut ? 'tertiary' : 'primary'}>
                  {soldOut ? 'Esgotado' : formatCurrency(priceOf(s, type))}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 24, gap: 16 }}>
          <Filters<TicketType>
            segments={[
              { key: 'member', label: 'Sócio' },
              { key: 'full', label: 'Inteira' },
              { key: 'half', label: 'Meia' },
            ]}
            value={type}
            onChange={setType}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: layout.gutter,
            }}
          >
            <Text variant="titleM">Quantidade</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Diminuir quantidade"
                onPress={() => setQty((q) => Math.max(1, q - 1))}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.m,
                  backgroundColor: colors.bgRaised2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="remove" size={20} color={colors.inkPrimary} />
              </Pressable>
              <Text variant="displayM" style={{ minWidth: 24, textAlign: 'center' }}>
                {qty}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Aumentar quantidade"
                onPress={() => setQty((q) => Math.min(sale.maxPerFan, q + 1))}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.m,
                  backgroundColor: colors.bgRaised2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={20} color={colors.inkPrimary} />
              </Pressable>
            </View>
          </View>
        </View>
        <View style={{ height: 120 }} />
      </Screen>

      <SafeAreaView
        edges={['bottom']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.bgCanvas,
          borderTopWidth: 1,
          borderColor: colors.lineHairline,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: layout.gutter, gap: 16 }}>
          <Text variant="displayM" style={{ flex: 1 }}>
            {formatCurrency(total)}
          </Text>
          <Button
            label={sector ? 'Comprar' : 'Escolha o setor'}
            disabled={!sector}
            loading={buying}
            onPress={buy}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
