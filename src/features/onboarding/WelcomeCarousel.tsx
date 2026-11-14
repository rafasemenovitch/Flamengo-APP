import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { AccessibilityInfo, Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Button, ClubCrest, Crest, Monogram, palette, Text, useTheme } from '@/design-system';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { haptic } from '@/utils/haptics';

/** Tempo de cada tela antes de passar sozinha (reinicia a cada troca, manual ou automática). */
const AUTO_MS = 7000;

/**
 * Cor contínua ao longo do carrossel: a cor final de uma tela é a inicial da próxima, do
 * vermelho do clube ao preto (rubro-negro).
 */
const STOPS = [
  palette.red600,
  palette.red600,
  palette.red700,
  '#560716',
  '#22060C',
  palette.ink950,
  palette.ink950,
];

const PAL = { id: 'pal', code: 'PAL', color: '#0B6B3A', shortName: 'Palmeiras' };
const WHITE = palette.white;
const SOFT = 'rgba(255,255,255,0.72)';
const LINE = 'rgba(255,255,255,0.16)';
/** Superfície escura das peças sobre o fundo colorido. */
const PANEL = 'rgba(10,10,11,0.55)';

interface Slide {
  kicker: string;
  title: string;
  caption: string;
  /** O que a área tem, em etiquetas. */
  tags?: string[];
  /** Fundo de tela inteira, atrás da arte e do texto. */
  backdrop?: (size: { w: number; h: number }) => ReactNode;
  art: (size: { w: number; h: number }) => ReactNode;
}

/**
 * Boas-vindas: carrossel de cartazes de tela inteira, um por área do app. Desliza com o dedo
 * e passa sozinho. Cada cartaz é montado para apresentar (não é print de tela), com a
 * diagramação do app: Anybody grande, sobrelinhas, números protagonistas e fios finos.
 * Os botões ficam sobre a própria cor da tela. `mode="tour"`: revisto pelas configurações.
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
  const { layout } = useTheme();
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  // Altura da arte de cada tela (o texto embaixo muda de tamanho de uma para outra).
  const [artH, setArtH] = useState<Record<number, number>>({});
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then(setScreenReader)
      .catch(() => undefined);
  }, []);

  const slides = SLIDES;
  const last = index === slides.length - 1;
  const footerH = (mode === 'welcome' ? 156 : 96) + Math.max(insets.bottom, 16);

  const goTo = (i: number) => {
    scroll.current?.scrollTo({ x: i * W, animated: !reduceMotion });
    setIndex(i);
  };

  useEffect(() => {
    if (held || reduceMotion || screenReader) return;
    const t = setTimeout(() => {
      const next = (index + 1) % slides.length;
      scroll.current?.scrollTo({ x: next * W, animated: true });
      setIndex(next);
    }, AUTO_MS);
    return () => clearTimeout(t);
  }, [index, held, reduceMotion, screenReader, slides.length, W]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.ink950 }}>
      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => setHeld(true)}
        onMomentumScrollEnd={(e) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / W));
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
            end={{ x: 1, y: 0.4 }}
            style={{ width: W, height: H, overflow: 'hidden' }}
          >
            {s.backdrop?.({ w: W, h: H })}
            {/* Arte: ocupa todo o espaço acima do texto, de ponta a ponta. */}
            <View
              style={{ flex: 1, marginTop: insets.top }}
              onLayout={(e) => {
                const v = Math.round(e.nativeEvent.layout.height);
                setArtH((prev) => (prev[i] === v ? prev : { ...prev, [i]: v }));
              }}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {s.art({ w: W, h: artH[i] ?? Math.round(H * 0.4) })}
            </View>
            <View
              accessible
              accessibilityLabel={`${s.kicker}. ${s.title}. ${s.caption}${s.tags ? `. ${s.tags.join(', ')}` : ''}`}
              style={{ paddingHorizontal: layout.gutter, paddingTop: 8, gap: 10, marginBottom: footerH }}
            >
              <Text variant="overline" style={{ color: SOFT }}>
                {s.kicker}
              </Text>
              <Text variant="displayL" style={{ color: WHITE, fontSize: 44, lineHeight: 44 }}>
                {s.title}
              </Text>
              <Text variant="bodyL" style={{ color: SOFT }}>
                {s.caption}
              </Text>
              {s.tags && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {s.tags.map((t) => (
                    <View
                      key={t}
                      style={{
                        paddingHorizontal: 10,
                        height: 28,
                        justifyContent: 'center',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.28)',
                      }}
                    >
                      <Text variant="labelM" style={{ color: WHITE }}>
                        {t}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </LinearGradient>
        ))}
      </ScrollView>

      {/* Rodapé sobre a cor da tela: progresso e ações. */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: layout.gutter,
          paddingBottom: Math.max(insets.bottom, 16),
          gap: 16,
        }}
      >
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Tela ${index + 1} de ${slides.length}`}
          style={{ flexDirection: 'row', gap: 6 }}
        >
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                height: 4,
                flex: i === index ? 3 : 1,
                borderRadius: 2,
                backgroundColor: i === index ? WHITE : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </View>
        {mode === 'welcome' ? (
          <View style={{ gap: 10 }}>
            <Button
              label="Criar conta ou entrar"
              variant="light"
              onPress={() => {
                haptic.select();
                onStart?.();
              }}
              fullWidth
            />
            <Button label="Entrar como visitante" variant="onMedia" onPress={() => onGuest?.()} fullWidth />
          </View>
        ) : (
          <Button
            label={last ? 'Pronto' : 'Próxima'}
            variant="light"
            icon={last ? 'checkmark' : 'arrow-forward'}
            iconPosition="right"
            onPress={() => (last ? onClose?.() : goTo(index + 1))}
            fullWidth
          />
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────── cartazes

const SLIDES: Slide[] = [
  {
    kicker: 'Flamengo App',
    title: 'Bem-vindo à Nação',
    caption: 'Jogo, ingresso, estádio e torcida no mesmo lugar. Do apito inicial ao fim do dia de Mengão.',
    backdrop: (s) => <Stripes {...s} opacity={0.12} />,
    art: (s) => <WelcomeArt {...s} />,
  },
  {
    kicker: 'Dia de jogo',
    title: 'Cada lance, na hora',
    caption: 'O placar mexe antes do replay. E o gol chega no seu bolso.',
    tags: ['Ao vivo', 'Lance a lance', 'Escalação', 'Alerta de gol'],
    art: (s) => <LiveArt {...s} />,
  },
  {
    kicker: 'Modo Maracanã',
    title: 'O estádio em 3D, do portão ao seu lugar',
    caption: 'Ache o que precisa e chegue sem se perder.',
    tags: ['Mais perto de você', 'Rotas', 'Sem escadas', 'Vista do lugar'],
    backdrop: (s) => <MaracanaBackdrop {...s} />,
    art: () => null,
  },
  {
    kicker: 'Ingressos',
    title: 'Compre e entre pelo rosto',
    caption: 'O ingresso fica na carteira e a catraca reconhece você.',
    tags: ['Compra', 'Carteira', 'Biometria facial', 'Prioridade de sócio'],
    art: (s) => <TicketArt {...s} />,
  },
  {
    kicker: 'Nação',
    title: 'Torcer vale pontos',
    caption: 'Cada palpite, voto e acerto sobe você na trilha. Só pontos, nunca dinheiro.',
    tags: ['Bolões', 'Enquetes', 'Quizzes', 'Trilha de prêmios'],
    art: (s) => <NationArt {...s} />,
  },
  {
    kicker: 'Assistente Fla',
    title: 'Dúvida? Pergunta aqui',
    caption: 'Portão, horário, fila, ingresso. Ele responde com o que está no app.',
    tags: ['Jogos', 'Ingressos', 'Estádio', 'Sócio'],
    art: (s) => <AssistantArt {...s} />,
  },
];

/** Listras rubro-negras em diagonal (o manto), discretas, como textura de fundo. */
function Stripes({ w, h, opacity = 0.14 }: { w: number; h: number; opacity?: number }) {
  const band = 34;
  const n = Math.ceil((w + h) / (band * 2)) + 2;
  return (
    <Svg width={w} height={h} style={{ position: 'absolute', left: 0, top: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const x = i * band * 2 - h;
        return (
          <Path
            key={i}
            d={`M${x} ${h} L${x + band} ${h} L${x + band + h} 0 L${x + h} 0 Z`}
            fill={palette.ink950}
            opacity={opacity}
          />
        );
      })}
    </Svg>
  );
}

function WelcomeArt({ w, h }: { w: number; h: number }) {
  const mono = Math.min(w * 0.84, (h * 0.9) / (577 / 600));
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Monogram color="white" width={mono} />
    </View>
  );
}

/** Placar gigante, escudos e o lance a lance correndo embaixo. */
function LiveArt({ w, h }: { w: number; h: number }) {
  const big = Math.min(w * 0.42, h * 0.46);
  return (
    <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: WHITE }} />
        <Text variant="overline" style={{ color: WHITE }}>
          {"Ao vivo · 67'"}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <ClubCrest size={52} />
          <Text variant="displayHero" style={{ color: WHITE, fontSize: big, lineHeight: big * 1.02 }}>
            2
          </Text>
        </View>
        <Text variant="displayM" style={{ color: SOFT, fontSize: big * 0.3 }}>
          ×
        </Text>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Crest team={PAL} size={52} />
          <Text variant="displayHero" style={{ color: SOFT, fontSize: big, lineHeight: big * 1.02 }}>
            1
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 10, borderTopWidth: 1, borderColor: LINE }}>
        {(
          [
            ["64'", 'Gol do Flamengo', 'De cabeça, no segundo pau', true],
            ["58'", 'Cartão amarelo', 'Palmeiras', false],
            ["45'", 'Intervalo', 'Flamengo 1 × 1 Palmeiras', false],
          ] as const
        ).map(([min, title, sub, hot]) => (
          <View
            key={min}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 9,
              borderBottomWidth: 1,
              borderColor: LINE,
            }}
          >
            <Text variant="displayS" style={{ color: hot ? WHITE : SOFT, width: 44 }}>
              {min}
            </Text>
            <View style={{ flex: 1 }}>
              <Text variant="titleS" style={{ color: WHITE }}>
                {title}
              </Text>
              <Text variant="bodyS" style={{ color: SOFT }}>
                {sub}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Imagem do mapa (assets/onboarding/maracana.png, 390 × 844, gerada por `npm run map:onboarding`). */
const MAP_W = 390;
const MAP_H = 844;

/**
 * O mapa 3D ocupa a tela inteira; o texto entra sobre um escurecido embaixo. As anotações
 * ficam nas coordenadas da imagem (ponto "você" em 195 × 310), escaladas como a imagem.
 */
function MaracanaBackdrop({ w, h }: { w: number; h: number }) {
  const k = Math.max(w / MAP_W, h / MAP_H);
  const left = (w - MAP_W * k) / 2;
  const at = (x: number, y: number) => ({ left: left + x * k, top: y * k });
  const tag = (text: string, pos: { left: number; top: number }, strong?: boolean) => (
    <View
      style={{
        position: 'absolute',
        ...pos,
        paddingHorizontal: 12,
        height: 34,
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: strong ? palette.red600 : 'rgba(10,10,11,0.86)',
        borderWidth: 1,
        borderColor: strong ? palette.red600 : LINE,
      }}
    >
      <Text variant="labelM" style={{ color: WHITE }}>
        {text}
      </Text>
    </View>
  );
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: w, height: h }}>
      <Image
        source={require('../../../assets/onboarding/maracana.png')}
        style={{ position: 'absolute', left, top: 0, width: MAP_W * k, height: MAP_H * k }}
        accessible={false}
      />
      <LinearGradient
        colors={['rgba(10,10,11,0)', 'rgba(10,10,11,0.92)', palette.ink950]}
        locations={[0, 0.35, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: h * 0.42, bottom: 0 }}
      />
      {tag('Você está aqui', at(212, 293), true)}
      {tag('Banheiro · 1 min', at(16, 140))}
    </View>
  );
}

/** Rosto reconhecido: cantos de leitura e um rosto em traço, desenho próprio. */
function FaceMark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M6 16V9a3 3 0 0 1 3-3h7M32 6h7a3 3 0 0 1 3 3v7M42 32v7a3 3 0 0 1-3 3h-7M16 42H9a3 3 0 0 1-3-3v-7"
        stroke={WHITE}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={18} cy={20} r={2.2} fill={WHITE} />
      <Circle cx={30} cy={20} r={2.2} fill={WHITE} />
      <Path
        d="M24 21v6h-2M18 32c3.5 3 8.5 3 12 0"
        stroke={WHITE}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/** Ingresso grande e inclinado, outro atrás, e o selo de entrada pela face. */
function TicketArt({ w, h }: { w: number; h: number }) {
  const { colors } = useTheme();
  const tw = Math.min(w * 0.84, 340);
  const ticket = (behind?: boolean) => (
    <View
      style={{
        width: tw,
        borderRadius: 16,
        backgroundColor: behind ? 'rgba(255,255,255,0.08)' : colors.bgRaised,
        borderWidth: behind ? 1 : 0,
        borderColor: LINE,
        padding: 20,
        gap: 14,
      }}
    >
      {behind ? (
        <View style={{ height: 150 }} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ClubCrest size={30} />
            <Text variant="bodyS" tone="tertiary">
              ×
            </Text>
            <Crest team={PAL} size={30} />
            <View style={{ flex: 1 }} />
            <Text variant="overline" tone="tertiary">
              Brasileirão
            </Text>
          </View>
          <View>
            <Text variant="displayM">Flamengo × Palmeiras</Text>
            <Text variant="bodyS" tone="secondary">
              Domingo, 16h · Maracanã
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              gap: 24,
              borderTopWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.lineHairline,
              paddingTop: 14,
            }}
          >
            {[
              ['Setor', 'Leste Inferior'],
              ['Bloco', '118'],
              ['Portão', 'D'],
            ].map(([k, v]) => (
              <View key={k}>
                <Text variant="overline" tone="tertiary">
                  {k}
                </Text>
                <Text variant="titleL">{v}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          transform: [{ rotate: '8deg' }, { translateX: 22 }, { translateY: -26 }],
        }}
      >
        {ticket(true)}
      </View>
      <View style={{ transform: [{ rotate: '-5deg' }] }}>{ticket()}</View>
      <View
        style={{
          position: 'absolute',
          right: (w - tw) / 2 - 6,
          bottom: Math.max(12, h * 0.08),
          width: 92,
          height: 92,
          borderRadius: 46,
          backgroundColor: palette.red600,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: WHITE,
        }}
      >
        <FaceMark size={50} />
      </View>
    </View>
  );
}

/** Mosaico da Nação: bolão, enquete, quiz e a trilha de prêmios. */
function NationArt({ w, h }: { w: number; h: number }) {
  const { colors } = useTheme();
  const gap = 10;
  const pad = 20;
  const col = (w - pad * 2 - gap) / 2;
  const tile = (bg: string, children: ReactNode, height: number, width = col) => (
    <View
      style={{
        width,
        height,
        borderRadius: 16,
        backgroundColor: bg,
        padding: 14,
        justifyContent: 'space-between',
      }}
    >
      {children}
    </View>
  );
  const tall = Math.max(170, h * 0.6);
  const half = (tall - gap) / 2;
  const bottom = Math.max(96, h - tall - gap - 24);
  return (
    <View style={{ flex: 1, paddingHorizontal: pad, justifyContent: 'center', gap }}>
      <View style={{ flexDirection: 'row', gap }}>
        {tile(
          palette.red600,
          <>
            <Text variant="overline" style={{ color: SOFT }}>
              Bolão
            </Text>
            <View>
              <Text variant="displayHero" style={{ color: WHITE, fontSize: 46, lineHeight: 50 }} numberOfLines={1}>
                2 × 1
              </Text>
              <Text variant="bodyS" style={{ color: SOFT }}>
                seu palpite
              </Text>
            </View>
            <Text variant="displayS" style={{ color: WHITE }}>
              +10 pts
            </Text>
          </>,
          tall
        )}
        <View style={{ gap }}>
          {tile(
            PANEL,
            <>
              <Text variant="overline" style={{ color: SOFT }}>
                Enquete
              </Text>
              <Text variant="titleS" style={{ color: WHITE }}>
                Craque do jogo?
              </Text>
              <View style={{ gap: 6 }}>
                {[0.64, 0.36].map((v, i) => (
                  <View key={i} style={{ height: 6, borderRadius: 3, backgroundColor: LINE }}>
                    <View
                      style={{
                        width: `${v * 100}%`,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: i ? SOFT : palette.red400,
                      }}
                    />
                  </View>
                ))}
              </View>
            </>,
            half
          )}
          {tile(
            PANEL,
            <>
              <Text variant="overline" style={{ color: SOFT }}>
                Quiz
              </Text>
              <Text variant="titleS" style={{ color: WHITE }}>
                Ano do primeiro Mundial?
              </Text>
              <Text variant="displayS" style={{ color: palette.red400 }}>
                1981
              </Text>
            </>,
            half
          )}
        </View>
      </View>
      {tile(
        PANEL,
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text variant="overline" style={{ color: SOFT }}>
                Trilha de prêmios
              </Text>
              <Text variant="displayM" style={{ color: WHITE }}>
                Raça
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text variant="displayM" style={{ color: WHITE }}>
                1.482
              </Text>
              <Text variant="bodyS" style={{ color: SOFT }}>
                pts
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {[1, 1, 1, 0.78, 0].map((v, i) => (
              <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: LINE }}>
                <View
                  style={{ width: `${v * 100}%`, height: 6, borderRadius: 3, backgroundColor: colors.accent }}
                />
              </View>
            ))}
          </View>
        </View>,
        Math.min(bottom, 120),
        w - pad * 2
      )}
    </View>
  );
}

/** Uma conversa que ocupa a tela. */
function AssistantArt({ w }: { w: number; h: number }) {
  const bubble = (text: string, mine: boolean, key: string) => (
    <View
      key={key}
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: w * 0.78,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
        borderBottomRightRadius: mine ? 6 : 18,
        borderBottomLeftRadius: mine ? 18 : 6,
        backgroundColor: mine ? WHITE : 'rgba(255,255,255,0.1)',
      }}
    >
      <Text variant="bodyL" style={{ color: mine ? palette.ink950 : WHITE }}>
        {text}
      </Text>
    </View>
  );
  return (
    <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center', gap: 10 }}>
      {bubble('Qual portão do meu setor?', true, 'a')}
      {bubble('Leste Inferior entra pelo Portão D, na Av. Maracanã.', false, 'b')}
      {bubble('Tem fila agora?', true, 'c')}
      {bubble('9 minutos. Pelo C, ao lado, está em 6.', false, 'd')}
      <View style={{ flexDirection: 'row', gap: 6, paddingLeft: 16, paddingTop: 4 }}>
        {[1, 0.6, 0.3].map((o, i) => (
          <View
            key={i}
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: WHITE, opacity: o }}
          />
        ))}
      </View>
    </View>
  );
}
