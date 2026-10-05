import { AGES } from '../data/catalog';
import { colors } from '../theme/tokens';

/** "Passeport" of a child: everything that makes the feed feel made for them. */
export type Kid = {
  id: string;
  name: string;
  /** Avatar: an emoji, or empty to show the first letter. */
  emoji: string;
  color: string;
  birthYear: number;
  birthMonth: number; // 1-12
  /** Day of the month (1-31); older passports may not have it. */
  birthDay?: number;
  gender: 'Fille' | 'Garçon' | 'Mixte';
  /** Size bucket they wear now (defaults to the one matching their age). */
  size: string;
  /** Size picked by hand ("porte plus grand / plus petit"). Otherwise it follows the age as the child grows. */
  sizeManual?: boolean;
  heightCm?: number;
  shoeSize?: number;
  favColors: string[];
  styles: string[];
  notes: string;
  /** Also show the next size up in their feed. */
  showNextSize: boolean;
};

/** `activeKidId` for "Pour offrir": browsing every size without a passport. */
export const GIFT = 'gift';

export const KID_COLORS = [colors.accent300, colors.accent2_300, colors.accent200, colors.accent2_200, colors.neutral300, '#f3d58a'];
export const KID_EMOJIS = ['', '🦊', '🐻', '🐰', '🦁', '🐼', '🐸', '🦄', '🐳', '🐞', '🌻', '⭐️'];
export const KID_STYLES = ['Confort', 'Classique', 'Coloré', 'Sport', 'Chic', 'Nature', 'Rigolo'];
export const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const DEMO_KIDS: Kid[] = [
  { id: 'k1', name: 'Léa', emoji: '🦊', color: colors.accent300, birthYear: 2023, birthMonth: 11, birthDay: 14, gender: 'Fille', size: '2-4 ans', heightCm: 94, shoeSize: 25, favColors: ['Rose', 'Jaune'], styles: ['Coloré', 'Confort'], notes: 'Adore les robes qui tournent. Pas de laine qui gratte !', showNextSize: false },
  { id: 'k2', name: 'Tom', emoji: '🐻', color: colors.accent2_300, birthYear: 2026, birthMonth: 1, birthDay: 8, gender: 'Garçon', size: '6-12 mois', heightCm: 72, favColors: ['Bleu', 'Vert'], styles: ['Confort'], notes: 'Préfère les bodies à pressions devant.', showNextSize: false },
];

export function ageInMonths(k: Pick<Kid, 'birthYear' | 'birthMonth' | 'birthDay'>, now = new Date()) {
  const months = (now.getFullYear() - k.birthYear) * 12 + (now.getMonth() + 1 - k.birthMonth);
  // A month only counts once the day of birth is reached.
  return Math.max(0, months - (k.birthDay && now.getDate() < k.birthDay ? 1 : 0));
}

/** The passport with its size brought up to date with today's age (unless set by hand). */
export function withCurrentSize(k: Kid, now = new Date()): Kid {
  if (k.sizeManual) return k;
  const size = bucketForMonths(ageInMonths(k, now));
  return size === k.size ? k : { ...k, size };
}

export const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

export function ageLabel(k: Pick<Kid, 'birthYear' | 'birthMonth' | 'birthDay'>) {
  const m = ageInMonths(k);
  if (m < 24) return `${m} mois`;
  const y = Math.floor(m / 12), r = m % 12;
  return r ? `${y} ans et ${r} mois` : `${y} ans`;
}

/** Size bucket matching an age in months. */
export function bucketForMonths(m: number) {
  if (m < 6) return AGES[0];
  if (m < 12) return AGES[1];
  if (m < 24) return AGES[2];
  if (m < 48) return AGES[3];
  if (m < 72) return AGES[4];
  if (m < 96) return AGES[5];
  return AGES[6];
}

const idx = (size: string) => (AGES as readonly string[]).indexOf(size);
export const nextSize = (size: string) => AGES[Math.min(idx(size) + 1, AGES.length - 1)];
export const prevSize = (size: string) => (idx(size) > 0 ? AGES[idx(size) - 1] : null);

/** "Léa fête ses 3 ans le 14 novembre" (this month or next), or null. */
export function birthdayNote(k: Kid, now = new Date()) {
  const thisMonth = now.getMonth() + 1;
  const nextMonth = (thisMonth % 12) + 1;
  if (k.birthMonth !== thisMonth && k.birthMonth !== nextMonth) return null;
  // Already celebrated this month: nothing to announce.
  if (k.birthMonth === thisMonth && k.birthDay && now.getDate() > k.birthDay) return null;
  // Next month is January when we're in December.
  const year = k.birthMonth < thisMonth ? now.getFullYear() + 1 : now.getFullYear();
  const turning = year - k.birthYear;
  if (turning < 1) return null;
  const when = k.birthDay
    ? `le ${k.birthDay === 1 ? '1er' : k.birthDay} ${MONTHS_LONG[k.birthMonth - 1]}`
    : k.birthMonth === thisMonth ? 'ce mois-ci' : 'le mois prochain';
  return `${k.name} fête ses ${turning} an${turning > 1 ? 's' : ''} ${when} 🎂`;
}

export const birthLabel = (k: Kid) => `${k.birthDay ? `${k.birthDay === 1 ? '1er' : k.birthDay} ` : ''}${MONTHS_LONG[k.birthMonth - 1]} ${k.birthYear}`;

// Age (in months) at which each size bucket starts, aligned with AGES.
const SIZE_START = [0, 6, 12, 24, 48, 72, 96];
/** Within this many months of the next size, Pimou nudges the parent ("Il grandit"). */
export const GROW_ALERT_MONTHS = 3;

/** "Il grandit": the size coming up soon, or null when it's not close yet. */
export function growthAlert(k: Kid) {
  const i = idx(k.size);
  if (i < 0 || i >= AGES.length - 1) return null;
  const months = SIZE_START[i + 1] - ageInMonths(k);
  if (months > GROW_ALERT_MONTHS) return null;
  const when = months <= 0 ? 'a déjà l\'âge du' : months === 1 ? 'passe le mois prochain au' : `passe dans ${months} mois au`;
  return { next: AGES[i + 1], months, text: `${k.name} ${when} ${AGES[i + 1]}` };
}
