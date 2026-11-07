import { HeaderShownContext } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { useContext } from 'react';
import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';
import { useFabVisibility } from './FabVisibility';
import { IconButton } from './IconButton';
import { Text } from './Text';

export interface ScreenProps {
  children: ReactNode;
  /** Envolve em ScrollView (padrão true). */
  scroll?: boolean;
  /** Título no cabeçalho com botão voltar (telas internas). */
  title?: string;
  /** Mostra botão voltar no cabeçalho (padrão: true quando há `title`). */
  showBack?: boolean;
  headerRight?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Reserva espaço no fim para o botão flutuante do Assistente (abas principais). */
  reserveFab?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  scroll = true,
  title,
  showBack,
  headerRight,
  refreshing,
  onRefresh,
  reserveFab,
  edges = ['top'],
  contentStyle,
}: ScreenProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const navigation = useNavigation();
  const hasHeader = !!title || !!headerRight;
  const canGoBack = (showBack ?? !!title) && navigation.canGoBack();
  // Telas com FAB: 96px extras para nada ficar coberto (especificação 6 e 12.15).
  const bottomPad = reserveFab ? spacing.x96 + spacing.xl : spacing.xxl;
  const fab = useFabVisibility();
  // Abaixo de um cabeçalho de navegação (abas), a área segura do topo já foi tratada.
  const parentHeaderShown = useContext(HeaderShownContext);
  const safeEdges = parentHeaderShown ? edges.filter((e) => e !== 'top') : edges;

  const header = hasHeader && (
    <View style={[styles.header, { paddingHorizontal: spacing.sm, minHeight: 52 }]}>
      <View style={styles.headerSide}>
        {canGoBack && (
          <IconButton
            icon="chevron-back"
            variant="plain"
            accessibilityLabel="Voltar"
            onPress={() => navigation.goBack()}
          />
        )}
      </View>
      <Text variant="titleM" numberOfLines={1} style={styles.headerTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>{headerRight}</View>
    </View>
  );

  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[{ paddingBottom: bottomPad }, contentStyle]}
      showsVerticalScrollIndicator={false}
      onScroll={reserveFab ? fab?.onScroll : undefined}
      scrollEventThrottle={32}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryText}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surfaceElevated}
          />
        ) : undefined
      }
    >
      <View style={styles.maxWidth}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.maxWidth, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={safeEdges} style={[styles.flex, { backgroundColor: colors.background }]}>
      {header}
      {inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  /** Em tablets o conteúdo não estica além de uma coluna confortável. */
  maxWidth: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerSide: { width: 96, flexDirection: 'row' },
  headerTitle: { flex: 1, textAlign: 'center' },
});
