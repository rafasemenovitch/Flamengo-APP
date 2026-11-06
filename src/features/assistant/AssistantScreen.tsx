import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  fonts,
  hasMascot,
  IconButton,
  Mascot,
  Text,
  useTheme,
  type MascotPose,
} from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { navigateByName } from '@/navigation/navigationRef';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import type { AssistantMessage, AssistantReply } from '@/types/fan';

type Msg = AssistantMessage & { reply?: AssistantReply };

/** Avatar do assistente: pose `assistant-*` ou um ponto de marca enquanto não há imagem. */
function AssistantAvatar({ pose, size }: { pose: MascotPose; size: number }) {
  const { colors } = useTheme();
  if (hasMascot(pose)) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        <Mascot pose={pose} size={size} />
      </View>
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="chatbubble-ellipses-outline" size={size * 0.5} color={colors.inkOnRed} />
    </View>
  );
}

/** Assistente Fla (especificação 13.6). Base: ChatThreadScreen do Zuno. */
export function AssistantScreen({ navigation, route }: RootScreenProps<'Assistant'>) {
  const { colors, layout, radius } = useTheme();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);
  const suggestions = useAsync(() => services.assistant.getSuggestions());
  const asked = useRef(false);

  const lastReply = [...messages].reverse().find((m) => m.role === 'assistant')?.reply;
  const avatarPose: MascotPose = thinking
    ? 'assistant-thinking'
    : lastReply && !lastReply.grounded
      ? 'assistant-sorry'
      : 'assistant-neutral';

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: 'user', text: q, createdAt: new Date().toISOString() },
    ]);
    setDraft('');
    setThinking(true);
    try {
      const reply = await services.assistant.ask(q, messages);
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: reply.text,
          sources: reply.sources,
          createdAt: new Date().toISOString(),
          reply,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: 'Perdemos o sinal. Tenta de novo em instantes?',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  useEffect(() => {
    const initial = route.params?.initialQuestion;
    if (initial && !asked.current) {
      asked.current = true;
      send(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.initialQuestion]);

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages.length, thinking]);

  const goTo = (r: string, params?: Record<string, string>) => {
    navigation.goBack();
    setTimeout(() => navigateByName(r, params), 250);
  };

  const empty = messages.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['top', 'bottom']}>
      {/* Cabeçalho compacto */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingLeft: layout.gutter,
          paddingRight: 8,
          height: 56,
          borderBottomWidth: 1,
          borderColor: colors.lineHairline,
        }}
      >
        <AssistantAvatar pose={avatarPose} size={32} />
        <View style={{ flex: 1 }}>
          <Text variant="titleS" accessibilityRole="header">
            Assistente Fla
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
            <Text variant="bodyS" tone="secondary">
              {thinking ? 'consultando a base oficial…' : 'online'}
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {empty ? (
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: layout.gutter,
              gap: 24,
            }}
          >
            <Mascot pose="assistant-wave" size={120} />
            <Text variant="titleL" align="center">
              Fala, rubro-negro! Como posso ajudar?
            </Text>
            <Text variant="bodyM" tone="secondary" align="center">
              Jogos, ingressos, Maracanã, sócio e loja. Respondo só com informação oficial e aviso quando não
              sei.
            </Text>
          </ScrollView>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: layout.gutter }}
            renderItem={({ item, index }) => {
              const mine = item.role === 'user';
              const prev = messages[index - 1];
              const gap = index === 0 ? 0 : prev?.role === item.role ? 8 : 16;
              return (
                <View
                  style={{
                    marginTop: gap,
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    gap: 8,
                    justifyContent: mine ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!mine && (
                    <AssistantAvatar
                      pose={item.reply && !item.reply.grounded ? 'assistant-sorry' : 'assistant-neutral'}
                      size={28}
                    />
                  )}
                  <View style={{ maxWidth: '80%', gap: 8, alignItems: mine ? 'flex-end' : 'flex-start' }}>
                    <View
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: radius.l,
                        borderBottomRightRadius: mine ? 4 : radius.l,
                        borderBottomLeftRadius: mine ? radius.l : 4,
                        backgroundColor: mine ? colors.accent : colors.bgRaised,
                      }}
                    >
                      <Text variant="bodyL" tone={mine ? 'onPrimary' : 'primary'}>
                        {item.text}
                      </Text>
                      {!!item.sources?.length && (
                        <Text variant="bodyS" tone="tertiary" style={{ marginTop: 8 }}>
                          Fonte: {item.sources.join(' · ')}
                        </Text>
                      )}
                    </View>
                    {item.reply?.action && (
                      <Button
                        label={item.reply.action.label}
                        variant="link"
                        onPress={() => goTo(item.reply!.action!.route, item.reply!.action!.params)}
                      />
                    )}
                  </View>
                </View>
              );
            }}
            ListFooterComponent={
              thinking ? (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}
                  accessibilityLabel="Assistente digitando"
                >
                  <AssistantAvatar pose="assistant-thinking" size={28} />
                  <ActivityIndicator color={colors.accentText} size="small" />
                </View>
              ) : undefined
            }
          />
        )}

        {messages.length <= 2 && !!suggestions.data?.length && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 8, paddingBottom: 12 }}
            style={{ flexGrow: 0 }}
          >
            {suggestions.data.slice(0, 4).map((s) => (
              <Pressable
                key={s}
                onPress={() => send(s)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  height: 32,
                  paddingHorizontal: 12,
                  borderRadius: radius.s,
                  borderWidth: 1,
                  borderColor: colors.lineHairline,
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text variant="labelM" tone="secondary">
                  {s}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: layout.gutter,
            paddingVertical: 8,
            borderTopWidth: 1,
            borderColor: colors.lineHairline,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Pergunte ao Assistente Fla"
            placeholderTextColor={colors.inkTertiary}
            onSubmitEditing={() => send(draft)}
            returnKeyType="send"
            accessibilityLabel="Mensagem para o assistente"
            style={{
              flex: 1,
              height: 52,
              borderRadius: radius.m,
              paddingHorizontal: 16,
              backgroundColor: colors.bgRaised,
              color: colors.inkPrimary,
              fontFamily: fonts.regular,
              fontSize: 16,
            }}
          />
          <Pressable
            onPress={() => send(draft)}
            disabled={!draft.trim() || thinking}
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            hitSlop={4}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: draft.trim() ? colors.accent : colors.bgRaised2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-up" size={20} color={draft.trim() ? colors.inkOnRed : colors.inkTertiary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
