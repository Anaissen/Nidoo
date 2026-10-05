import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, TextInputProps, View } from 'react-native';

import { Account } from '../lib/account';
import { colors, fonts, ICON_STROKE } from '../theme/tokens';
import { Txt } from './ui';

export const fieldStyle = (error?: boolean) => ({
  height: 50, borderRadius: 999, borderWidth: error ? 2 : 1, borderColor: error ? colors.accent700 : colors.divider, backgroundColor: colors.neutral100,
  paddingHorizontal: 18, fontFamily: fonts.body, fontSize: 15, color: colors.text, outlineWidth: 0,
} as const);

/** A labelled text field; the error shows under it once the form was submitted. */
export function Field({ label, error, style, ...rest }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Txt size={13} weight="semi">{label}</Txt>
      <TextInput placeholderTextColor={colors.neutral600} accessibilityLabel={label} style={fieldStyle(!!error)} {...rest} />
      {error && <Txt size={12} color={colors.accent700}>{error}</Txt>}
    </View>
  );
}

export function PasswordField({ label = 'Mot de passe', value, onChangeText, error, isNew }: { label?: string; value: string; onChangeText: (t: string) => void; error?: string; isNew?: boolean }) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? EyeOff : Eye;
  return (
    <View style={{ gap: 6 }}>
      <Txt size={13} weight="semi">{label}</Txt>
      <View>
        <TextInput
          value={value} onChangeText={onChangeText} secureTextEntry={!shown} accessibilityLabel={label}
          placeholder={isNew ? '8 caractères minimum' : ''} placeholderTextColor={colors.neutral600}
          autoCapitalize="none" autoComplete={isNew ? 'new-password' : 'current-password'} textContentType={isNew ? 'newPassword' : 'password'}
          style={[fieldStyle(!!error), { paddingRight: 52 }]}
        />
        <Pressable onPress={() => setShown(!shown)} accessibilityLabel={shown ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} hitSlop={8} style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}>
          <Icon size={20} strokeWidth={ICON_STROKE} color={colors.neutral700} />
        </Pressable>
      </View>
      {error && <Txt size={12} color={colors.accent700}>{error}</Txt>}
    </View>
  );
}

/** Name, contact and delivery address: used at sign-up and in "Mes informations". */
export function AccountFields({ a, onChange, errors }: { a: Account; onChange: (p: Partial<Account>) => void; errors: Partial<Record<keyof Account, string>> }) {
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Prénom" value={a.firstName} onChangeText={(t) => onChange({ firstName: t })} autoCapitalize="words" autoComplete="given-name" error={errors.firstName} style={{ flex: 1 }} />
        <Field label="Nom" value={a.lastName} onChangeText={(t) => onChange({ lastName: t })} autoCapitalize="words" autoComplete="family-name" error={errors.lastName} style={{ flex: 1 }} />
      </View>
      <Field label="E-mail" value={a.email} onChangeText={(t) => onChange({ email: t.trim() })} placeholder="ex. prenom@mail.fr" keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
      <Field label="Téléphone (facultatif)" value={a.phone} onChangeText={(t) => onChange({ phone: t.replace(/[^0-9+ ]/g, '') })} placeholder="06 12 34 56 78" keyboardType="phone-pad" autoComplete="tel" error={errors.phone} />
      <Txt size={13} color={colors.neutral700}>Ton adresse sert pour la livraison à domicile, tes bordereaux d'envoi et pour trouver les vendeurs près de chez toi. Elle n'est jamais affichée en entier.</Txt>
      <Field label="Adresse" value={a.street} onChangeText={(t) => onChange({ street: t })} placeholder="Numéro et rue" autoComplete="street-address" error={errors.street} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Code postal" value={a.zip} onChangeText={(t) => onChange({ zip: t.replace(/\D/g, '').slice(0, 5) })} keyboardType="number-pad" autoComplete="postal-code" error={errors.zip} style={{ width: 130 }} />
        <Field label="Ville" value={a.city} onChangeText={(t) => onChange({ city: t })} autoCapitalize="words" error={errors.city} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
