import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Text, useTheme } from '@/design-system';

/** Mesmos campos do perfil: superfície, raio, fonte e contorno do design system. */
export function AuthField({
  label,
  password,
  ...props
}: TextInputProps & { label: string; password?: boolean }) {
  const { colors, spacing, radius, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="labelM" tone="secondary">
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 52,
          borderRadius: radius.m,
          backgroundColor: colors.bgRaised,
          borderWidth: 1,
          borderColor: focused ? colors.lineStrong : 'transparent',
        }}
      >
        <TextInput
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
          secureTextEntry={password && !visible}
          placeholderTextColor={colors.inkTertiary}
          selectionColor={colors.accentText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            typography.bodyL,
            { flex: 1, minHeight: 52, paddingHorizontal: spacing.lg, color: colors.inkPrimary },
          ]}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => setVisible(!visible)}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.inkSecondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
