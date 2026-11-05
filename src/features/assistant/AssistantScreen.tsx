import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ClubCrest, IconButton, Text, fonts, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { navigateByName } from '@/navigation/navigationRef';
import { services } from '@/services';
import type { AssistantMessage, AssistantReply } from '@/types/fan';

type Msg = AssistantMessage & { reply?: AssistantReply };

const WELCOME: Msg = {
  id: 'welcome',
  role: 'assistant',
  text: 'Oi! Sou o Assistente Fla. Posso ajudar com jogos, ingressos, o Modo Maracanã, sócio-torcedor e a loja. Respondo só com informações oficiais disponíveis e aviso quando não souber.',
  createdAt: new Date().toISOString(),
};

/** Chat do Assistente (base: ChatThreadScreen do Zuno) com sugestões, fontes e atalhos. */
export function AssistantScreen({ navigation, route }: RootScreenProps<'Assistant'>) {
  const { colors, spacing, layout, radius } = useTheme();
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);
  const suggestions = useAsync(() => services.assistant.getSuggestions());
  const asked = useRef(false);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text: q, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setDraft('');
    setThinking(true);
    try {
      const reply = await services.assistant.ask(q, messages);
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'assistant', text: reply.text, sources: reply.sources, createdAt: new Date().toISOString(), reply }]);
    } catch {
      setMessages((m) => [...m, { id: `e-${Date.now()}`, role: 'assistant', text: 'Tive um problema para responder agora. Tente de novo em instantes.', createdAt: new Date().toISOString() }]);
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
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages.length, thinking]);

  const goTo = (route: string, params?: Record<string, string>) => {
    navigation.goBack();
    setTimeout(() => navigateByName(route, params), 250);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={[styles.row, { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
        <View style={{ width: 44, alignItems: 'center' }}><ClubCrest size={30} /></View>
        <View style={{ flex: 1 }}>
          <Text variant="title" accessibilityRole="header">Assistente Fla</Text>
          <Text variant="footnote" tone="tertiary">Respostas da base oficial · versão demo</Text>
        </View>
        <IconButton icon="close" variant="plain" accessibilityLabel="Fechar assistente" onPress={() => navigation.goBack()} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: layout.gutter, gap: spacing.md }}
          renderItem={({ item }) => {
            const mine = item.role === 'user';
            return (
              <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', gap: spacing.xs }}>
                <View
                  style={{
                    maxWidth: '86%',
                    padding: spacing.md,
                    borderRadius: radius.lg,
                    borderBottomRightRadius: mine ? 4 : radius.lg,
                    borderBottomLeftRadius: mine ? radius.lg : 4,
                    backgroundColor: mine ? colors.primary : colors.surfaceElevated,
                    borderWidth: mine ? 0 : 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text variant="body" tone={mine ? 'onPrimary' : 'primary'}>{item.text}</Text>
                  {!!item.sources?.length && (
                    <View style={[styles.row, { gap: 4, marginTop: spacing.sm, flexWrap: 'wrap' }]}>
                      <Ionicons name="document-text-outline" size={12} color={colors.textTertiary} />
                      <Text variant="footnote" tone="tertiary">Fonte: {item.sources.join(' · ')}</Text>
                    </View>
                  )}
                  {item.reply && !item.reply.grounded && (
                    <View style={[styles.row, { gap: 4, marginTop: spacing.sm }]}>
                      <Ionicons name="help-circle-outline" size={12} color={colors.warning} />
                      <Text variant="footnote" tone="warning">Sem informação oficial para essa pergunta</Text>
                    </View>
                  )}
                </View>
                {item.reply?.action && (
                  <Button label={item.reply.action.label} size="sm" variant="secondary" icon="arrow-forward" iconPosition="right" onPress={() => goTo(item.reply!.action!.route, item.reply!.action!.params)} />
                )}
              </View>
            );
          }}
          ListFooterComponent={
            thinking ? (
              <View style={[styles.row, { gap: spacing.sm, marginTop: spacing.md }]} accessibilityLabel="Assistente digitando">
                <ActivityIndicator color={colors.primaryText} size="small" />
                <Text variant="caption" tone="tertiary">Consultando a base oficial…</Text>
              </View>
            ) : undefined
          }
        />

        {messages.length <= 2 && !!suggestions.data?.length && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: spacing.sm, paddingBottom: spacing.sm }} style={{ flexGrow: 0 }}>
            {suggestions.data.map((s) => (
              <Pressable
                key={s}
                onPress={() => send(s)}
                accessibilityRole="button"
                style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
              >
                <Text variant="label" tone="brand">{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={[styles.row, { padding: spacing.sm, paddingHorizontal: layout.gutter, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Pergunte algo ao Assistente Fla"
            placeholderTextColor={colors.textTertiary}
            onSubmitEditing={() => send(draft)}
            returnKeyType="send"
            accessibilityLabel="Mensagem para o assistente"
            style={{ flex: 1, minHeight: 44, borderRadius: radius.pill, paddingHorizontal: spacing.lg, backgroundColor: colors.surfaceMuted, color: colors.textPrimary, fontFamily: fonts.regular, fontSize: 15 }}
          />
          <Pressable
            onPress={() => send(draft)}
            disabled={!draft.trim() || thinking}
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: draft.trim() ? colors.primary : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-up" size={20} color={draft.trim() ? colors.onPrimary : colors.textTertiary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' } });
