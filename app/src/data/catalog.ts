// Sizes, colours, conditions and delivery options. The listings themselves live on the server (src/lib/listings.ts).

export const AGES = ['0-6 mois', '6-12 mois', '1-2 ans', '2-4 ans', '4-6 ans', '6-8 ans', '8-10 ans'] as const;
export const GENDERS = ['Fille', 'Garçon', 'Mixte'] as const;
export const SEASONS = ['Printemps', 'Été', 'Automne', 'Hiver', 'Toutes saisons'] as const;
export const CONDS = ['Neuf avec étiquette', 'Très bon état', 'Bon état', 'Satisfaisant'] as const;

/** What is sold: clothes (sized by age), shoes (by EU size) or socks & tights (by size range). */
export type Category = 'vetement' | 'chaussures' | 'chaussettes';
export const CATEGORIES: { id: Category; label: string; short: string; emoji: string }[] = [
  { id: 'vetement', label: 'Vêtements', short: 'Vêtements', emoji: '👕' },
  { id: 'chaussures', label: 'Chaussures', short: 'Chaussures', emoji: '👟' },
  { id: 'chaussettes', label: 'Chaussettes & collants', short: 'Chaussettes', emoji: '🧦' },
];
export const categoryOf = (p: { category?: Category }) => CATEGORIES.find((c) => c.id === (p.category ?? 'vetement'))!;
/** Children's shoe sizes (EU), from first steps to 10 years. */
export const SHOE_SIZES = Array.from({ length: 22 }, (_, i) => 15 + i);
/** Usual size ranges on socks and tights (EU shoe size they fit). */
export const SOCK_SIZES = ['15-18', '19-22', '23-26', '27-30', '31-34', '35-38'] as const;
export const sockFits = (range: string | undefined, shoe: number) => {
  const [lo, hi] = (range ?? '').split('-').map(Number);
  return shoe >= lo && shoe <= hi;
};
/** Rough age for a shoe size, so shoes also show up when browsing by age. */
export function ageForShoe(size: number): (typeof AGES)[number] {
  if (size <= 17) return AGES[0];
  if (size <= 19) return AGES[1];
  if (size <= 22) return AGES[2];
  if (size <= 26) return AGES[3];
  if (size <= 30) return AGES[4];
  if (size <= 33) return AGES[5];
  return AGES[6];
}
export const ageForSock = (range: string) => ageForShoe(Number(range.split('-')[0]) + 1);
/** "Pointure 25", "T. 23-26" or the age, as shown on a listing. */
export const sizeLabel = (p: { category?: Category; shoeSize?: number; sockSize?: string; age: string }) =>
  p.category === 'chaussures' && p.shoeSize ? `Pointure ${p.shoeSize}` : p.category === 'chaussettes' && p.sockSize ? `T. ${p.sockSize}` : p.age;
/** "pièce" for clothes, "paire" for shoes and socks. */
export const unitOf = (p: { category?: Category }, plural = false) => (p.category && p.category !== 'vetement' ? 'paire' : 'pièce') + (plural ? 's' : '');

// Swatch shown in the colour filter. Multicolore is drawn as a conic gradient in the design.
export const COLORS: Record<string, string | string[]> = {
  Blanc: '#f4efe6',
  Rose: '#e9b9a8',
  Bleu: '#9fb3c8',
  Vert: '#aebf92',
  Jaune: '#e8c46a',
  Beige: '#d9c6a5',
  Marine: '#4a5670',
  Multicolore: ['#e9b9a8', '#e8c46a', '#aebf92', '#9fb3c8'],
};

// Stripe pair used by photo placeholders, per article colour.
export const TONES: Record<string, [string, string]> = {
  Blanc: ['#eee7db', '#f9f4ed'],
  Rose: ['#ffe1d0', '#fff2eb'],
  Bleu: ['#dcd3c4', '#eee7db'],
  Vert: ['#e1eecc', '#f0fae1'],
  Jaune: ['#ffc6a5', '#ffe1d0'],
  Beige: ['#eee7db', '#f9f4ed'],
  Marine: ['#c0b6a5', '#dcd3c4'],
  Multicolore: ['#ccdbb2', '#e1eecc'],
};

export const PRICES = [
  { l: 'Moins de 10 €', min: 0, max: 10 },
  { l: '10 – 20 €', min: 10, max: 20 },
  { l: '20 – 30 €', min: 20, max: 30 },
  { l: 'Plus de 30 €', min: 30, max: 1e9 },
];

export type Seller = {
  id: string; name: string; city: string; rating: string; reviews: number;
  sales: number; init: string; since: string; ship: string;
  /** "Parent vérifié": ID + phone checked. */
  verified: boolean;
  /** Rough distance from the user, guessed from the postcodes. */
  distanceKm: number;
  /** Buyers who confirmed the "lavé et plié" promise on reception. */
  washedConfirms: number;
};

/** The person's own seller card, before their real figures arrive from the server. */
export const ME_SELLER: Seller = { id: 'me', name: '', city: '', rating: '–', reviews: 0, sales: 0, init: '?', since: String(new Date().getFullYear()), ship: '48 h', verified: false, distanceKm: 0, washedConfirms: 0 };

export type ListingType = 'lot' | 'unique';
export type LotLine = { n: string; q: number };

export type Product = {
  id: number; type: ListingType; title: string; brand: string; age: string; size: string;
  gender: string; season: string; condition: string; price: number; color: string; sid: string;
  count?: number; contents?: LotLine[]; ph?: string;
  /** Seller accepts price offers (default: yes, it's second hand). */
  negotiable?: boolean;
  /** Seller promises the clothes are washed and folded. */
  washed?: boolean;
  /** Written by the seller (real listings). */
  description?: string;
  /** Real photos (public URLs, or local files while publishing). Without any, a striped placeholder. */
  photos?: string[];
  /** Row id in the Supabase `listings` table, for listings that live on the server. */
  remoteId?: number;
  /** Already sold (still shown in conversations and orders). */
  sold?: boolean;
  /** Clothes when not set. */
  category?: Category;
  /** Shoes: EU size. */
  shoeSize?: number;
  /** Socks and tights: size range, e.g. "23-26". */
  sockSize?: string;
};

export type DeliveryId = 'relais' | 'domicile' | 'main';

export const DELIVERY: { id: DeliveryId; title: string; sub: string; price: number; name: string }[] = [
  { id: 'relais', title: 'Point relais', sub: '2 à 4 jours', price: 3.9, name: 'Point relais' },
  { id: 'domicile', title: 'À domicile', sub: '2 à 3 jours', price: 5.9, name: 'Domicile' },
  { id: 'main', title: 'Main propre', sub: 'Rendez-vous avec le vendeur', price: 0, name: 'Main propre' },
];

export const SELL_DELIVERY: { id: DeliveryId; title: string; sub: string }[] = [
  { id: 'relais', title: 'Point relais', sub: "Tu déposes le colis, l'étiquette est générée" },
  { id: 'domicile', title: 'Domicile', sub: "Livré chez l'acheteur" },
  { id: 'main', title: 'Remise en main propre', sub: 'Rendez-vous fixé par message' },
];

export const DEFAULT_COMMISSION = 8;

export const DISTANCES = [
  { l: 'Moins de 2 km', km: 2 },
  { l: 'Moins de 5 km', km: 5 },
  { l: 'Moins de 10 km', km: 10 },
];

/** Max distance for a hand-to-hand meeting to be offered. */
export const HANDOVER_MAX_KM = 15;

/** Guide des états: what each condition means, with what's accepted. */
export const CONDITION_GUIDE: { name: string; short: string; ok: string[]; no: string[]; tones: [string, string] }[] = [
  { name: 'Neuf avec étiquette', short: 'Jamais porté, étiquette encore attachée.', ok: ['Étiquette du magasin présente', 'Aucune trace de lavage'], no: ['Porté même une fois'], tones: ['#e1eecc', '#f0fae1'] },
  { name: 'Très bon état', short: 'Porté quelques fois, comme neuf.', ok: ['Couleurs vives', 'Pas de bouloche visible', 'Aucune tache ni accroc'], no: ['Tache, même petite', 'Tissu détendu'], tones: ['#ccdbb2', '#e1eecc'] },
  { name: 'Bon état', short: 'Bien porté, encore beau.', ok: ['Légère bouloche', 'Couleurs un peu passées', 'Petit défaut signalé en photo'], no: ['Trou', 'Tache visible', 'Fermeture cassée'], tones: ['#ffe1d0', '#fff2eb'] },
  { name: 'Satisfaisant', short: 'Pour jouer, la crèche ou le jardin.', ok: ['Usure visible', 'Petite tache ou bouton à recoudre, en photo'], no: ['Vêtement troué ou déchiré', 'Odeur'], tones: ['#eee7db', '#f9f4ed'] },
];

/** Garde-robe de saison: a starter checklist per season. `kw` is what we search the catalogue with. */
export type WardrobeLine = { id: string; label: string; kw: string; need: number; got: number };
export const WARDROBE_TEMPLATES: Record<'hiver' | 'ete', { title: string; lines: Omit<WardrobeLine, 'got'>[] }> = {
  hiver: { title: 'automne-hiver', lines: [
    { id: 'bodies', label: 'Bodies ou t-shirts manches longues', kw: 'bod', need: 5 },
    { id: 'pyjamas', label: 'Pyjamas', kw: 'pyjama', need: 3 },
    { id: 'pulls', label: 'Pulls ou gilets', kw: 'gilet', need: 3 },
    { id: 'pantalons', label: 'Pantalons', kw: 'pantalon', need: 3 },
    { id: 'manteau', label: 'Manteau ou doudoune', kw: 'doudoune', need: 1 },
    { id: 'bonnet', label: 'Bonnet', kw: 'bonnet', need: 1 },
  ] },
  ete: { title: 'printemps-été', lines: [
    { id: 'tshirts', label: 'T-shirts', kw: 't-shirt', need: 5 },
    { id: 'shorts', label: 'Shorts', kw: 'short', need: 3 },
    { id: 'robes', label: 'Robes ou salopettes', kw: 'robe', need: 2 },
    { id: 'pyjamas', label: 'Pyjamas légers', kw: 'pyjama', need: 2 },
    { id: 'cire', label: 'Ciré ou coupe-vent', kw: 'ciré', need: 1 },
    { id: 'chapeau', label: 'Chapeau', kw: 'chapeau', need: 1 },
  ] },
};
