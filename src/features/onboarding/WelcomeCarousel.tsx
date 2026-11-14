import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { AccessibilityInfo, Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  ClubCrest,
  Crest,
  LiveIndicator,
  Monogram,
  palette,
  ProgressBar,
  Text,
  useTheme,
} from '@/design-system';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { haptic } from '@/utils/haptics';

/** Tempo de cada tela antes de passar sozinha (reinicia a cada troca, manual ou automática). */
const AUTO_MS = 7000;

/**
 * Cor contínua ao longo do carrossel: a cor final de uma tela é a inicial da próxima, do
 * vermelho do clube ao preto (rubro-negro), em vez de um fundo solto por tela.
 */
const STOPS = [
  palette.red600,
  palette.red600,
  palette.red700,
  '#5E0818',
  '#2A070E',
  palette.ink950,
  palette.ink950,
];

const PAL = { id: 'pal', code: 'PAL', color: '#0B6B3A', shortName: 'Palmeiras' };

interface Slide {
  kicker: string;
  title: string;
  caption: string;
  preview: ReactNode;
}

/**
 * Boas-vindas: carrossel que desliza com o dedo e passa sozinho (como o do Zuno), com cada
 * área do app mostrada pelas próprias peças do app, sem mascote e sem ícone genérico.
 * Rodapé fixo com a marca e as ações. `mode="tour"` é a mesma apresentação, revista
 * pelas configurações (só com "Fechar").
 */
export function WelcomeCarousel({
  mode = 'welcome',
  onStart,
  onGuest,
  onClose,
}: {
  mode?: 'welcome' | 'tour';
  onStart?: () => void;
  onGuest?: () => void;
  onClose?: () => void;
}) {
  const { colors, layout } = useTheme();
  const { width } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then(setScreenReader)
      .catch(() => undefined);
  }, []);

  const slides = useSlides();
  const last = index === slides.length - 1;

  const goTo = (i: number) => {
    scroll.current?.scrollTo({ x: i * width, animated: !reduceMotion });
    setIndex(i);
  };

  // Passa sozinho; para se a pessoa estiver arrastando, com "reduzir movimento" ou leitor de tela.
  useEffect(() => {
    if (held || reduceMotion || screenReader) return;
    const t = setTimeout(() => {
      const next = (index + 1) % slides.length;
      scroll.current?.scrollTo({ x: next * width, animated: true });
      setIndex(next);
    }, AUTO_MS);
    return () => clearTimeout(t);
  }, [index, held, reduceMotion, screenReader, slides.length, width]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scroll}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => setHeld(true)}
          onMomentumScrollEnd={(e) => {
            setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
            setHeld(false);
          }}
          accessibilityRole="adjustable"
          accessibilityLabel={`Apresentação, tela ${index + 1} de ${slides.length}`}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'increment' && !last) goTo(index + 1);
            if (e.nativeEvent.actionName === 'decrement' && index > 0) goTo(index - 1);
          }}
        >
          {slides.map((s, i) => (
            <LinearGradient
              key={s.kicker}
              colors={[STOPS[i]!, STOPS[i + 1]!]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width, height: '100%' }}
            >
              {/* Monograma CRF como marca-d'água: a assinatura do clube atrás de cada área. */}
              {i > 0 && (
                <Monogram
                  color="white"
                  width={width * 1.05}
                  opacity={0.05}
                  style={{ position: 'absolute', right: -width * 0.3, top: '8%' }}
                />
              )}
              <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: layout.gutter,
                  }}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  {s.preview}
                </View>
                <View
                  accessible
                  accessibilityLabel={`${s.kicker}. ${s.title}. ${s.caption}`}
                  style={{ paddingHorizontal: layout.gutter, paddingBottom: 28, gap: 8 }}
                >
                  <Text variant="overline" tone="onMedia" style={{ opacity: 0.72 }}>
                    {s.kicker}
                  </Text>
                  <Text variant="displayL" tone="onMedia">
                    {s.title}
                  </Text>
                  <Text variant="bodyL" tone="onMedia" style={{ opacity: 0.85 }}>
                    {s.caption}
                  </Text>
                </View>
              </SafeAreaView>
            </LinearGradient>
          ))}
        </ScrollView>
      </View>

      <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.bgCanvas }}>
        <View style={{ paddingHorizontal: layout.gutter, paddingTop: 18, paddingBottom: 12, gap: 18 }}>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Tela ${index + 1} de ${slides.length}`}
            style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}
          >
            {slides.map((_, i) => (
              <View
                key={i}
                style={{
                  height: 4,
                  width: i === index ? 24 : 8,
                  borderRadius: 2,
                  backgroundColor: i === index ? colors.accent : colors.lineHairline,
                }}
              />
            ))}
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="titleS">Flamengo App</Text>
              <Monogram color="red" width={26} />
            </View>
          </View>

          {mode === 'welcome' ? (
            <View style={{ gap: 10 }}>
              <Button
                label="Criar conta ou entrar"
                onPress={() => {
                  haptic.select();
                  onStart?.();
                }}
                fullWidth
              />
              <Button
                label="Entrar como visitante"
                variant="secondary"
                onPress={() => onGuest?.()}
                fullWidth
              />
            </View>
          ) : (
            <Button
              label={last ? 'Pronto' : 'Próxima'}
              icon={last ? 'checkmark' : 'arrow-forward'}
              iconPosition="right"
              onPress={() => (last ? onClose?.() : goTo(index + 1))}
              fullWidth
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

/** As seis áreas, cada uma com uma prévia montada com as peças reais do app. */
function useSlides(): Slide[] {
  return [
    {
      kicker: 'Bem-vindo à Nação',
      title: 'O Flamengo inteiro num app só',
      caption: 'Jogo, ingresso, estádio e torcida. Do apito inicial ao fim do dia de Mengão.',
      preview: <Monogram color="white" width={190} opacity={0.95} />,
    },
    {
      kicker: 'Dia de jogo',
      title: 'Cada lance, na hora',
      caption: 'Placar ao vivo, escalação e o aviso do gol no bolso.',
      preview: <LivePreview />,
    },
    {
      kicker: 'Modo Maracanã',
      title: 'O estádio em 3D, do portão ao seu lugar',
      caption: 'O banheiro mais perto, o caminho sem escadas e a vista do seu setor.',
      preview: <MaracanaPreview />,
    },
    {
      kicker: 'Ingressos',
      title: 'Compre e entre pelo rosto',
      caption: 'O ingresso fica na carteira. No portão, a biometria facial libera a catraca.',
      preview: <TicketPreview />,
    },
    {
      kicker: 'Nação',
      title: 'Torcer vale pontos',
      caption: 'Palpite no bolão, presença no estádio e conquistas. Só pontos, nunca dinheiro.',
      preview: <NationPreview />,
    },
    {
      kicker: 'Assistente Fla',
      title: 'Dúvida? Pergunta aqui',
      caption: 'Portão, horário, fila, ingresso: ele responde com o que está no app.',
      preview: <AssistantPreview />,
    },
  ];
}

/** Superfície das prévias: o card do app (raio 16, sem sombra). */
function Surface({ children, width = 320 }: { children: ReactNode; width?: number }) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={{
        width: '100%',
        maxWidth: width,
        borderRadius: radius.l,
        backgroundColor: colors.bgRaised,
        padding: 18,
        gap: 14,
      }}
    >
      {children}
    </View>
  );
}

function LivePreview() {
  const { colors } = useTheme();
  return (
    <Surface>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="labelM" tone="secondary">
          Brasileirão · Maracanã
        </Text>
        <LiveIndicator minute="67'" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', gap: 6, width: 64 }}>
          <ClubCrest size={44} />
          <Text variant="labelM">FLA</Text>
        </View>
        <Text variant="displayXl">2 × 1</Text>
        <View style={{ alignItems: 'center', gap: 6, width: 64 }}>
          <Crest team={PAL} size={44} />
          <Text variant="labelM">PAL</Text>
        </View>
      </View>
      <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline, paddingTop: 12, gap: 6 }}>
        <Text variant="bodyS">
          <Text variant="bodyS" tone="brand">
            {"64'"}
          </Text>{' '}
          Gol do Flamengo, de cabeça
        </Text>
        <Text variant="bodyS" tone="secondary">
          {"58' Cartão amarelo para o Palmeiras"}
        </Text>
      </View>
    </Surface>
  );
}

function MaracanaPreview() {
  const { colors, radius, layout } = useTheme();
  const { width: screen } = useWindowDimensions();
  // Tamanho explícito: a imagem é 360 × 250 (gerada por `npm run map:onboarding`).
  const w = Math.min(340, screen - layout.gutter * 2);
  return (
    <View style={{ width: w, borderRadius: radius.l, overflow: 'hidden' }}>
      <Image
        source={require('../../../assets/onboarding/maracana.png')}
        style={{ width: w, height: (w * 250) / 360 }}
        resizeMode="cover"
        accessible={false}
      />
      <View
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          padding: 12,
          borderRadius: radius.m,
          backgroundColor: colors.bgRaised,
        }}
      >
        <View>
          <Text variant="overline" tone="tertiary">
            Você está em
          </Text>
          <Text variant="titleM">Leste Inferior</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="overline" tone="tertiary">
            Banheiro
          </Text>
          <Text variant="titleM">1 min</Text>
        </View>
      </View>
    </View>
  );
}

function TicketPreview() {
  const { colors } = useTheme();
  const field = (label: string, value: string) => (
    <View style={{ gap: 2 }}>
      <Text variant="overline" tone="tertiary">
        {label}
      </Text>
      <Text variant="titleL">{value}</Text>
    </View>
  );
  return (
    <Surface>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <ClubCrest size={28} />
        <Text variant="bodyS" tone="tertiary">
          ×
        </Text>
        <Crest team={PAL} size={28} />
      </View>
      <View style={{ gap: 2 }}>
        <Text variant="titleL">Flamengo × Palmeiras</Text>
        <Text variant="bodyS" tone="secondary">
          hoje, 21h30 · Maracanã
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 22,
          borderTopWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.lineHairline,
          paddingTop: 14,
        }}
      >
        {field('Setor', 'Leste Inferior')}
        {field('Portão', 'D')}
      </View>
      <Text variant="bodyS" tone="secondary">
        Entrada pela biometria facial
      </Text>
    </Surface>
  );
}

function NationPreview() {
  const { colors } = useTheme();
  return (
    <Surface>
      <Text variant="bodyS" tone="secondary">
        Temporada 2026 · nível 4
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Text variant="displayL" tone="brand">
          Raça
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text variant="displayM">1.482</Text>
          <Text variant="bodyS" tone="secondary">
            pts
          </Text>
        </View>
      </View>
      <ProgressBar value={0.78} />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          borderColor: colors.lineHairline,
          paddingTop: 12,
        }}
      >
        <Text variant="bodyS">Bolão · seu palpite</Text>
        <Text variant="numericTable">2 × 1</Text>
      </View>
    </Surface>
  );
}

function AssistantPreview() {
  const { colors, radius } = useTheme();
  const bubble = (text: string, mine: boolean) => (
    <View
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: radius.l,
        backgroundColor: mine ? colors.accent : colors.bgRaised2,
      }}
    >
      <Text variant="bodyM" style={{ color: mine ? colors.inkOnRed : colors.inkPrimary }}>
        {text}
      </Text>
    </View>
  );
  return (
    <Surface>
      {bubble('Qual portão do meu setor?', true)}
      {bubble('Leste Inferior entra pelo Portão D, na Av. Maracanã. A fila está em 9 min.', false)}
    </Surface>
  );
}
