import { Linking } from 'react-native';

import { LEGAL } from '../data/legal';
import { colors } from '../theme/tokens';
import { Txt } from './ui';

/** An e-mail to the réclamation address, already saying what it is about (article, order number…). */
export function mailtoReclamation(subject: string, details: string[] = []) {
  const body = ['Bonjour,', '', ...details, ...(details.length ? [''] : []), 'Ce qui ne va pas :', '', '', '(Tu peux ajouter des photos à cet e-mail.)'].join('\n');
  return `mailto:${LEGAL.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** "<before> reclamation@pimou.fr<after>": the address opens that pre-filled e-mail. */
export function Reclamation({ before, after = '.', subject, details, size = 12, color = colors.neutral700 }: {
  before: string; after?: string; subject: string; details?: string[]; size?: number; color?: string;
}) {
  return (
    <Txt size={size} color={color}>
      {before}
      <Txt size={size} weight="semi" color={colors.accent700} style={{ textDecorationLine: 'underline' }} onPress={() => Linking.openURL(mailtoReclamation(subject, details))}>{LEGAL.email}</Txt>
      {after}
    </Txt>
  );
}
