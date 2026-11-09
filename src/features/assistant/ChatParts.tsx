import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Tabs, Text, useTheme } from '@/design-system';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type {
  AssistantAction,
  AssistantCard,
  AssistantExpression,
  AssistantGesture,
  AssistantTopic,
} from '@/types/fan';
import { EXPRESSION_AVATAR, GESTURE } from './poses';

/** Avatar circular do assistente (recorte do headset à gola). Troca a expressão no mesmo lugar. */
export function AssistantAvatar({ expression, size }: { expression: AssistantExpression; size: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: colors.bgRaised2,
      }}
    >
      <Image
        source={EXPRESSION_AVATAR[expression]}
        style={{ width: size, height: size }}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

export function GestureImage({ gesture, size }: { gesture: AssistantGesture; size: number }) {
  return (
    <Image
      source={GESTURE[gesture]}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

/** Entrada suave de cada mensagem (só fade sob "reduzir movimento"). */
export function Appear({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReduceMotion();
  const { motion } = useTheme();
  const a = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: reduceMotion ? motion.duration.reduced : motion.duration.base,
      easing: motion.easing.standard,
      useNativeDriver: true,
    }).start();
  }, [a, reduceMotion, motion]);
  return (
    <Animated.View
      style={{
        opacity: a,
        transform: [
          { translateY: reduceMotion ? 0 : a.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** Três pontinhos de "digitando". */
export function TypingDots() {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const a = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(Animated.timing(a, { toValue: 3, duration: 900, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [a, reduceMotion]);
  return (
    <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel="Digitando">
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.inkSecondary,
            opacity: reduceMotion
              ? 0.7
              : a.interpolate({
                  inputRange: [i, i + 0.5, i + 1, 3],
                  outputRange: [0.3, 1, 0.3, 0.3],
                  extrapolate: 'clamp',
                }),
          }}
        />
      ))}
    </View>
  );
}

/** Card dentro da conversa: jogo, ingresso, passo a passo ou números. */
export function ChatCard({
  card,
  onOpen,
}: {
  card: AssistantCard;
  onOpen: (route: string, params?: Record<string, string>) => void;
}) {
  const { colors, radius } = useTheme();
  const box = { backgroundColor: colors.bgRaised2, borderRadius: radius.m, padding: 16, gap: 6 } as const;

  if (card.kind === 'match') {
    return (
      <Pressable
        onPress={() => onOpen('MatchDetail', { matchId: card.matchId })}
        accessibilityRole="button"
        style={({ pressed }) => [box, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text variant="overline" tone="secondary">
          {card.subtitle}
        </Text>
        <Text variant="titleM">{card.title}</Text>
        <Text variant="bodyS" tone="secondary">
          {card.meta}
        </Text>
      </Pressable>
    );
  }
  if (card.kind === 'ticket') {
    return (
      <Pressable
        onPress={() => onOpen('TicketDetail', { ticketId: card.ticketId })}
        accessibilityRole="button"
        style={({ pressed }) => [box, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text variant="overline" tone="secondary">
          {card.title}
        </Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {[
            ['Setor', card.sector],
            ['Portão', card.gate],
          ].map(([k, v]) => (
            <View key={k}>
              <Text variant="bodyS" tone="tertiary">
                {k}
              </Text>
              <Text variant="titleM">{v}</Text>
            </View>
          ))}
        </View>
        <Text variant="bodyS" tone="secondary">
          {card.seat}
        </Text>
      </Pressable>
    );
  }
  if (card.kind === 'steps') {
    return (
      <View style={[box, { gap: 10 }]}>
        {card.title && (
          <Text variant="overline" tone="secondary">
            {card.title}
          </Text>
        )}
        {card.steps.map((s, i) => (
          <View key={s} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Text variant="displayS" tone="brand" style={{ width: 20 }}>
              {i + 1}
            </Text>
            <Text variant="bodyM" style={{ flex: 1 }}>
              {s}
            </Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={[box, { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 }]}>
      {card.items.map((it) => (
        <View
          key={it.label}
          style={{ width: card.items.length > 3 ? '50%' : `${100 / card.items.length}%`, paddingRight: 8 }}
        >
          <Text variant="bodyS" tone="tertiary" numberOfLines={2}>
            {it.label}
          </Text>
          <Text variant="displayS" numberOfLines={1}>
            {it.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ChatActions({
  actions,
  onAction,
}: {
  actions: AssistantAction[];
  onAction: (a: AssistantAction) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {actions.map((a) => (
        <Button
          key={a.label}
          label={a.label}
          size="sm"
          variant={a.primary ? 'primary' : 'secondary'}
          icon={a.route ? 'arrow-forward' : undefined}
          iconPosition="right"
          onPress={() => onAction(a)}
        />
      ))}
    </View>
  );
}

/**
 * Aba "Fazer pergunta": temas em abas sublinhadas e perguntas em linhas.
 * Perguntas já feitas ficam marcadas, sem sumir.
 */
export function QuestionSheet({
  visible,
  topics,
  asked,
  onClose,
  onPick,
}: {
  visible: boolean;
  topics: AssistantTopic[];
  asked: Set<string>;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const { colors, radius, layout } = useTheme();
  const [topicId, setTopicId] = useState(topics[0]?.id ?? '');
  const topic = topics.find((t) => t.id === topicId) ?? topics[0];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
        onPress={onClose}
        accessible={false}
      >
        <Pressable onPress={() => undefined} accessible={false}>
          <SafeAreaView
            edges={['bottom']}
            style={{
              backgroundColor: colors.bgRaised,
              borderTopLeftRadius: radius.l,
              borderTopRightRadius: radius.l,
              maxHeight: '100%',
            }}
          >
            <View style={{ alignItems: 'center', paddingTop: 10 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.lineHairline }} />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingLeft: layout.gutter,
                paddingRight: 8,
                paddingTop: 12,
                paddingBottom: 8,
              }}
            >
              <Text variant="titleL" style={{ flex: 1 }}>
                Sobre o que você quer saber?
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={22} color={colors.inkSecondary} />
              </Pressable>
            </View>
            <Tabs
              segments={topics.map((t) => ({ key: t.id, label: t.title }))}
              value={topic?.id ?? ''}
              onChange={setTopicId}
              accessibilityLabel="Temas"
            />
            <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ paddingVertical: 8 }}>
              {topic?.questions.map((q, i) => {
                const done = asked.has(q.id);
                return (
                  <Pressable
                    key={q.id}
                    onPress={() => onPick(q.id)}
                    accessibilityRole="button"
                    accessibilityLabel={q.text}
                    style={({ pressed }) => ({
                      minHeight: 56,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: layout.gutter,
                      borderTopWidth: i ? 1 : 0,
                      borderColor: colors.lineHairline,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Text
                      variant="titleS"
                      style={{ flex: 1, color: done ? colors.inkTertiary : colors.inkPrimary }}
                    >
                      {q.text}
                    </Text>
                    {done ? (
                      <Ionicons name="checkmark" size={18} color={colors.inkTertiary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={colors.inkTertiary} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
