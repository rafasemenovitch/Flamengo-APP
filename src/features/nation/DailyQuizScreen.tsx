import { View } from 'react-native';

import { Screen, useTheme } from '@/design-system';
import { QuizCard } from '@/features/shared/Engagement';

/** Quiz Diário: a pergunta do dia, aberta pelo card de "Jogos do dia" na Nação. */
export function DailyQuizScreen() {
  const { layout } = useTheme();
  return (
    <Screen title="Quiz Diário">
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: 16 }}>
        <QuizCard />
      </View>
    </Screen>
  );
}
