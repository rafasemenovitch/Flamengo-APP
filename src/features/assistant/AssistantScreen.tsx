import { PlaceholderScreen } from '@/features/shared/PlaceholderScreen';

export function AssistantScreen() {
  return (
    <PlaceholderScreen
      title="Assistente Fla"
      icon="chatbubble-ellipses"
      phase={3}
      description="Chat com sugestões de perguntas, respostas baseadas nos dados do app e numa FAQ local. Pronto para conectar um LLM que responde só com informação oficial."
    />
  );
}
