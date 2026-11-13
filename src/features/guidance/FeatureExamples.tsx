import { Platform, View, useWindowDimensions } from 'react-native';

import { Button, DemoBadge, ProgressBar, Text, useTheme } from '@/design-system';
import { STADIUM } from '@/data/demo/stadium';
import { StadiumMap } from '@/features/stadium/StadiumMap';
import { TicketCard } from '@/features/tickets/TicketCard';
import { ScoreText } from '@/features/bolao/BolaoParts';
import { Reaction } from '@/features/assistant/ChatParts';
import type { Ticket } from '@/types/tickets';

const exampleTicket: Ticket = {
  id: 'presentation-example',
  matchId: 'example',
  sectorId: 'leste-inf',
  sectorName: 'Leste Inferior',
  gate: 'C',
  seat: 'Fila K · Cadeira 14',
  holderName: 'Exemplo demonstrativo',
  type: 'full',
  price: 0,
  purchasedAt: '2026-01-01',
  status: 'valid',
  qrPayload: 'DEMONSTRATIVO-SEM-VALIDADE',
  isDemo: true,
};

// A prévia mantém os componentes reais, sem expor controles fictícios ao teclado na web.
const inertExample = Platform.OS === 'web' ? { inert: true } : {};

/** Exemplos estáticos; nenhum serviço, permissão ou dado da conta é usado aqui. */
export function FeatureExample({ kind }: { kind: 'maracana' | 'tickets' | 'nation' | 'assistant' }) {
  const { colors, spacing, layout } = useTheme();
  const { width } = useWindowDimensions();
  if (kind === 'maracana')
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel="Mapa esquemático de exemplo: setores, portões e serviços. Não é uma planta oficial."
      >
        <View
          {...inertExample}
          aria-hidden
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <StadiumMap
            stadium={STADIUM}
            height={Math.min(240, width - layout.gutter * 2)}
            highlightSectorId="leste-inf"
            facilityTypes={['restroom', 'first-aid']}
          />
        </View>
        <Text variant="bodyS" tone="secondary" align="center">
          Setores · portões · serviços
        </Text>
      </View>
    );
  if (kind === 'tickets')
    return (
      <View style={{ gap: spacing.md }}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel="Ingresso demonstrativo, sem validade: setor Leste Inferior, portão C."
        >
          <View
            {...inertExample}
            aria-hidden
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <TicketCard ticket={exampleTicket} />
          </View>
        </View>
        <Text variant="bodyS" tone="secondary">
          Carteira · Setor Leste Inferior · Portão C
        </Text>
      </View>
    );
  if (kind === 'nation')
    return (
      <View style={{ gap: spacing.xl }}>
        <View style={{ gap: spacing.sm }}>
          <Text variant="overline" tone="secondary">
            Bolão · palpite de exemplo
          </Text>
          <ScoreText home={2} away={1} variant="displayXl" />
          <DemoBadge />
        </View>
        <View
          style={{
            gap: spacing.md,
            paddingTop: spacing.xl,
            borderTopWidth: 1,
            borderColor: colors.lineHairline,
          }}
        >
          <Text variant="titleM">Trilha da temporada</Text>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Progresso demonstrativo da trilha"
            accessibilityValue={{ min: 0, max: 100, now: 60 }}
          >
            <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <ProgressBar value={0.6} />
            </View>
          </View>
          <Text variant="bodyS" tone="secondary">
            Progresso de exemplo · a classificação do Bolão fica no seu bolão.
          </Text>
        </View>
      </View>
    );
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ alignItems: 'center' }}>
        <Reaction expression="wave" size={120} />
      </View>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel="Exemplo do assistente: Fazer pergunta, tema Jogos, Quando é o próximo jogo?"
      >
        <View
          {...inertExample}
          aria-hidden
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ gap: spacing.lg }}
        >
          <Button
            label="Fazer pergunta"
            icon="chatbubble-ellipses-outline"
            fullWidth
            onPress={() => undefined}
          />
          <Text variant="labelM" tone="brand">
            Tema: Jogos
          </Text>
          <View
            style={{
              paddingVertical: spacing.lg,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.lineHairline,
            }}
          >
            <Text variant="titleS">Quando é o próximo jogo?</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
