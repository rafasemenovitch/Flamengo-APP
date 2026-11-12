import { Pressable, View } from 'react-native';

import { Text, useTheme } from '@/design-system';
import { AuthField } from './AuthField';
import { digits, GENDERS, maskCpf, maskDate, personalFormErrors, type PersonalForm } from './profileForm';

export function PersonalFields({
  value,
  onChange,
  disabled,
  tried,
}: {
  value: PersonalForm;
  onChange: (value: PersonalForm) => void;
  disabled?: boolean;
  tried?: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  const errors = tried ? personalFormErrors(value) : {};
  const set = (key: keyof PersonalForm) => (next: string) => onChange({ ...value, [key]: next });
  const error = (key: keyof PersonalForm) =>
    errors[key] && (
      <Text variant="bodyS" tone="danger">
        {errors[key]}
      </Text>
    );
  return (
    <View style={{ gap: spacing.lg }}>
      <AuthField
        label="Nome"
        value={value.givenName}
        onChangeText={set('givenName')}
        autoCapitalize="words"
        textContentType="givenName"
        autoComplete="given-name"
        maxLength={100}
        editable={!disabled}
      />
      {error('givenName')}
      <AuthField
        label="Sobrenome"
        value={value.surname}
        onChangeText={set('surname')}
        autoCapitalize="words"
        textContentType="familyName"
        autoComplete="family-name"
        maxLength={150}
        editable={!disabled}
      />
      {error('surname')}
      <AuthField
        label="CPF"
        value={value.cpf}
        onChangeText={(text) => set('cpf')(maskCpf(text))}
        placeholder="000.000.000-00"
        keyboardType="number-pad"
        maxLength={14}
        editable={!disabled}
      />
      {error('cpf')}
      <AuthField
        label="Data de nascimento"
        value={value.birthDate}
        onChangeText={(text) => set('birthDate')(maskDate(text))}
        placeholder="DD/MM/AAAA"
        keyboardType="number-pad"
        maxLength={10}
        editable={!disabled}
      />
      {error('birthDate')}
      <View style={{ gap: spacing.sm }}>
        <Text variant="labelM" tone="secondary">
          Gênero
        </Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Gênero"
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}
        >
          {GENDERS.map(([gender, label]) => {
            const selected = value.gender === gender;
            return (
              <Pressable
                key={gender}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ checked: selected, selected, disabled }}
                disabled={disabled}
                onPress={() => onChange({ ...value, gender })}
                style={{
                  minHeight: 44,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.s,
                  justifyContent: 'center',
                  backgroundColor: selected ? colors.inkPrimary : 'transparent',
                  borderWidth: 1,
                  borderColor: selected ? colors.inkPrimary : colors.lineHairline,
                }}
              >
                <Text variant="labelM" style={{ color: selected ? colors.bgCanvas : colors.inkSecondary }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {error('gender')}
      <AuthField
        label="Torcedor desde"
        value={value.fanSince}
        onChangeText={(text) => set('fanSince')(digits(text).slice(0, 4))}
        placeholder="Ano (ex.: 2000)"
        keyboardType="number-pad"
        maxLength={4}
        editable={!disabled}
      />
      {error('fanSince')}
    </View>
  );
}
