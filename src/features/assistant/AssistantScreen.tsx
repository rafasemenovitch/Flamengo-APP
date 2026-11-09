import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, IconButton, Text, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { navigateByName } from '@/navigation/navigationRef';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import type { AssistantAction, AssistantReply } from '@/types/fan';
import { haptic } from '@/utils/haptics';
import {
  Appear,
  AssistantAvatar,
  ChatActions,
  ChatCard,
  GestureImage,
  Reaction,
  QuestionSheet,
  TypingDots,
} from './ChatParts';

type Msg =
  | { id: string; role: 'intro' }
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; reply: AssistantReply }
  | { id: string; role: 'pending'; search: boolean };

const WELCOME: AssistantReply = {
  text: 'Fala, rubro-negro! Toque em "Fazer pergunta" e escolha um tema.',
  expression: 'wave',
  grounded: true,
  sources: [],
  followUps: ['proximo-jogo', 'meu-portao', 'meus-pontos'],
};

/** Tamanho da reação do mascote ao lado de cada resposta. */
const REACTION = 112;

let seq = 0;
const nid = () => `m${Date.now()}-${seq++}`;

/**
 * Assistente Fla: conversa com perguntas prontas (sem teclado). O mascote,
 * na skin "modo assistente", muda de reação conforme a conversa: acena,
 * pensa, busca com a lupa, explica, aponta, mostra o mapa, fica sem graça...
 */
export function AssistantScreen({ navigation, route }: RootScreenProps<'Assistant'>) {
  const { colors, layout, radius } = useTheme();
  const topics = useAsync(() => services.assistant.getTopics());
  const [messages, setMessages] = useState<Msg[]>([{ id: 'intro', role: 'intro' }]);
  const [sheet, setSheet] = useState(false);
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const busy = messages.some((m) => m.role === 'pending');
  const list = useRef<FlatList<Msg>>(null);
  const started = useRef(false);

  const ask = async (questionId: string) => {
    const q = services.assistant.findQuestion(questionId);
    if (!q || busy) return;
    haptic.select();
    setSheet(false);
    setAsked((s) => new Set(s).add(q.id));
    const pendingId = nid();
    setMessages((m) => [
      ...m,
      { id: nid(), role: 'user', text: q.text },
      { id: pendingId, role: 'pending', search: !!q.search },
    ]);
    const reply = await services.assistant.answer(q.id);
    setMessages((m) => m.map((x) => (x.id === pendingId ? { id: pendingId, role: 'assistant', reply } : x)));
  };

  // Boas-vindas (aceno) e pergunta inicial vinda de outra tela.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t = setTimeout(
      () => setMessages((m) => [...m, { id: nid(), role: 'assistant', reply: WELCOME }]),
      350
    );
    const initial = route.params?.initialQuestion;
    const match = initial
      ? topics.data?.flatMap((tp) => tp.questions).find((q) => q.text === initial)
      : undefined;
    if (match) setTimeout(() => ask(match.id), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics.data]);

  useEffect(() => {
    const t = setTimeout(() => list.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages]);

  const open = (r: string, params?: Record<string, string>) => {
    navigation.goBack();
    setTimeout(() => navigateByName(r, params), 250);
  };
  const onAction = (a: AssistantAction) => {
    if (a.askId) ask(a.askId);
    else if (a.route) open(a.route, a.params);
  };

  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  const renderItem = ({ item }: { item: Msg }) => {
    if (item.role === 'intro') {
      return (
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 24, gap: 12 }}>
          <GestureImage gesture="open-arms" size={180} />
          <Text variant="titleL" align="center">
            Como posso ajudar?
          </Text>
        </View>
      );
    }
    if (item.role === 'user') {
      return (
        <Appear>
          <View style={{ alignItems: 'flex-end', marginTop: 16 }}>
            <View
              style={{
                maxWidth: '80%',
                backgroundColor: colors.accent,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: radius.l,
                borderBottomRightRadius: 4,
              }}
            >
              <Text variant="bodyL" tone="onPrimary">
                {item.text}
              </Text>
            </View>
          </View>
        </Appear>
      );
    }
    if (item.role === 'pending') {
      return (
        <Appear>
          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <Reaction expression="thinking" gesture={item.search ? 'magnifier' : undefined} size={REACTION} />
            <View
              style={{
                backgroundColor: colors.bgRaised,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: radius.l,
                borderBottomLeftRadius: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <TypingDots />
            </View>
          </View>
        </Appear>
      );
    }

    const r = item.reply;
    const isLast = item.id === lastAssistantId;
    const sideBySide = r.gesture === 'point-side' && r.card;
    return (
      <Appear>
        <View style={{ marginTop: 16, gap: 10 }}>
          {/* Uma única reação por resposta: o gesto (se houver) ou a expressão. */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            {!sideBySide && (
              <Reaction expression={r.expression ?? 'neutral'} gesture={r.gesture} size={REACTION} />
            )}
            <View
              style={{
                flexShrink: 1,
                backgroundColor: colors.bgRaised,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: radius.l,
                borderBottomLeftRadius: 4,
              }}
            >
              <Text variant="bodyL">{r.text}</Text>
            </View>
          </View>
          <View style={{ gap: 10 }}>
            {r.card &&
              (sideBySide ? (
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                  <Reaction expression={r.expression ?? 'neutral'} gesture="point-side" size={REACTION} />
                  <View style={{ flex: 1 }}>
                    <ChatCard card={r.card} onOpen={open} />
                  </View>
                </View>
              ) : (
                <ChatCard card={r.card} onOpen={open} />
              ))}
            {!!r.actions?.length && <ChatActions actions={r.actions} onAction={onAction} />}
            {isLast && !busy && !!r.followUps?.length && (
              <View style={{ gap: 8, marginTop: 4 }}>
                {r.followUps.map((id) => {
                  const q = services.assistant.findQuestion(id);
                  if (!q) return null;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => ask(id)}
                      accessibilityRole="button"
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        minHeight: 40,
                        paddingHorizontal: 12,
                        borderRadius: radius.s,
                        borderWidth: 1,
                        borderColor: colors.lineHairline,
                        alignSelf: 'flex-start',
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <Text variant="labelM" tone="secondary">
                        {q.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Appear>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['top', 'bottom']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingLeft: layout.gutter,
          paddingRight: 8,
          height: 72,
          borderBottomWidth: 1,
          borderColor: colors.lineHairline,
        }}
      >
        <AssistantAvatar expression="neutral" size={44} />
        <View style={{ flex: 1 }}>
          <Text variant="titleS" accessibilityRole="header">
            Assistente Fla
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
            <Text variant="bodyS" tone="secondary">
              {busy ? 'digitando…' : 'online'}
            </Text>
          </View>
        </View>
        <IconButton
          icon="close"
          variant="plain"
          accessibilityLabel="Fechar assistente"
          onPress={() => navigation.goBack()}
        />
      </View>

      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: layout.gutter, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />

      <View
        style={{
          paddingHorizontal: layout.gutter,
          paddingTop: 12,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderColor: colors.lineHairline,
        }}
      >
        <Button
          label="Fazer pergunta"
          icon="chatbubble-ellipses-outline"
          onPress={() => setSheet(true)}
          disabled={busy || !topics.data}
          fullWidth
        />
      </View>

      {topics.data && (
        <QuestionSheet
          visible={sheet}
          topics={topics.data}
          asked={asked}
          onClose={() => setSheet(false)}
          onPick={ask}
        />
      )}
    </SafeAreaView>
  );
}
