import { useState } from 'react';
import { Linking } from 'react-native';

import { TODO } from '../data/legal';
import { colors } from '../theme/tokens';
import { Txt } from './ui';

// E-mails, then web addresses (with or without https://, e.g. "impots.gouv.fr").
const LINK = String.raw`[\w.+-]+@[\w-]+(?:\.[\w-]+)+|https?:\/\/[^\s,;)]+|(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:fr|com|io)(?:\/[^\s,;)]*)?`;
// "[[tel:0612345678]]": a phone number shown only once asked for.
const TEL = String.raw`\[\[tel:\d+\]\]`;
const PARTS = new RegExp(`(${TEL}|${LINK}|${TODO.replace(/[[\]]/g, '\\$&')})`, 'gi');
const IS_LINK = new RegExp(`^(?:${LINK})$`, 'i');

/** A paragraph of a legal page: links open the mail app or the browser; "[à compléter]" stands out. */
export function LegalText({ text, size = 14, color = colors.neutral800 }: { text: string; size?: number; color?: string }) {
  const parts = text.split(PARTS).filter(Boolean);
  return (
    <Txt size={size} color={color}>
      {parts.map((p, i) => {
        if (p === TODO) return <Txt key={i} size={size} weight="semi" color={colors.accent700}>{p}</Txt>;
        if (p.startsWith('[[tel:')) return <HiddenPhone key={i} digits={p.slice(6, -2)} size={size} color={color} />;
        if (!IS_LINK.test(p)) return p;
        const url = p.includes('@') ? `mailto:${p}` : /^https?:/.test(p) ? p : `https://${p}`;
        return <Txt key={i} size={size} weight="semi" color={colors.accent700} style={{ textDecorationLine: 'underline' }} onPress={() => Linking.openURL(url)}>{p}</Txt>;
      })}
    </Txt>
  );
}

/** "clique ici pour l'afficher", then the number (which calls it). */
function HiddenPhone({ digits, size, color }: { digits: string; size: number; color: string }) {
  const [shown, setShown] = useState(false);
  const link = { size, weight: 'semi' as const, color: colors.accent700, style: { textDecorationLine: 'underline' as const } };
  if (shown) return <Txt {...link} onPress={() => Linking.openURL(`tel:${digits}`)}>{digits.replace(/(\d{2})(?=\d)/g, '$1 ')}</Txt>;
  return <Txt size={size} color={color}>clique <Txt {...link} onPress={() => setShown(true)} accessibilityRole="button">ici</Txt> pour l'afficher</Txt>;
}
