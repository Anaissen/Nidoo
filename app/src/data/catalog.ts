// Demo catalogue, copied from the Claude Design prototype (Nidoo.dc.html).

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
  /** Distance from the user (demo: the user lives in Paris 11e). */
  distanceKm: number;
  /** Buyers who confirmed the "lavé et plié" promise on reception. */
  washedConfirms: number;
};

export const SELLERS: Record<string, Seller> = {
  s1: { id: 's1', name: 'Camille R.', city: 'Paris 11e', rating: '4,9', reviews: 86, sales: 128, init: 'C', since: '2024', ship: '24 h', verified: true, distanceKm: 1.2, washedConfirms: 64 },
  s2: { id: 's2', name: 'Julie M.', city: 'Paris 12e', rating: '4,8', reviews: 41, sales: 64, init: 'J', since: '2025', ship: '48 h', verified: true, distanceKm: 3.4, washedConfirms: 27 },
  s3: { id: 's3', name: 'Sophie & Marc', city: 'Montreuil', rating: '5,0', reviews: 19, sales: 22, init: 'S', since: '2025', ship: '24 h', verified: false, distanceKm: 6.8, washedConfirms: 15 },
  s4: { id: 's4', name: 'Inès B.', city: 'Lyon 6e', rating: '4,7', reviews: 33, sales: 41, init: 'I', since: '2023', ship: '72 h', verified: true, distanceKm: 465, washedConfirms: 22 },
  me: { id: 'me', name: 'Élodie', city: 'Paris 11e', rating: '4,9', reviews: 12, sales: 18, init: 'É', since: '2025', ship: '24 h', verified: false, distanceKm: 0, washedConfirms: 9 },
};

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
  /** Real photos (public URLs, or local files while publishing). Demo listings use striped placeholders. */
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

const P = (
  id: number, type: ListingType, title: string, brand: string, age: string, gender: string,
  season: string, condition: string, price: number, color: string, sid: string,
  extra: Partial<Product> = {},
): Product => ({ id, type, title, brand, age, size: age, gender, season, condition, price, color, sid, ...extra });

export const PRODUCTS: Product[] = [
  P(1, 'lot', 'Lot naissance 10 bodies & pyjamas', 'Petit Bateau', '0-6 mois', 'Mixte', 'Toutes saisons', 'Très bon état', 28, 'Blanc', 's1', { washed: true, count: 10, contents: [{ n: 'Bodies manches longues', q: 5 }, { n: 'Pyjamas velours', q: 3 }, { n: 'Bonnets', q: 2 }], ph: 'photo · lot plié à plat' }),
  P(2, 'unique', 'Robe en lin smockée', 'Jacadi', '2-4 ans', 'Fille', 'Été', 'Neuf avec étiquette', 18, 'Rose', 's2', { washed: true, ph: 'photo · robe de face' }),
  P(3, 'lot', 'Lot rentrée garçon 7 pièces', 'Okaïdi', '4-6 ans', 'Garçon', 'Automne', 'Bon état', 32, 'Marine', 's3', { washed: true, count: 7, contents: [{ n: 'Pantalons', q: 2 }, { n: 'Sweats', q: 2 }, { n: 'T-shirts manches longues', q: 3 }], ph: 'photo · lot rentrée' }),
  P(4, 'unique', 'Doudoune légère sans manches', 'Cyrillus', '4-6 ans', 'Mixte', 'Hiver', 'Très bon état', 22, 'Bleu', 's1', { washed: true, ph: 'photo · doudoune' }),
  P(5, 'lot', "Lot 4 pyjamas d'hiver", 'Petit Bateau', '1-2 ans', 'Mixte', 'Hiver', 'Bon état', 16, 'Beige', 's4', { washed: true, count: 4, contents: [{ n: 'Pyjamas une pièce', q: 4 }], ph: 'photo · pyjamas' }),
  P(6, 'unique', 'Salopette en velours côtelé', 'Bonton', '1-2 ans', 'Fille', 'Automne', 'Très bon état', 14, 'Vert', 's2', { ph: 'photo · salopette' }),
  P(7, 'lot', 'Lot été fille 9 pièces', "Tape à l'œil", '8-10 ans', 'Fille', 'Été', 'Bon état', 25, 'Multicolore', 's4', { washed: true, count: 9, contents: [{ n: 'Shorts', q: 3 }, { n: 'T-shirts', q: 4 }, { n: 'Robes', q: 2 }], ph: 'photo · lot été' }),
  P(8, 'unique', 'Gigoteuse 6-18 mois', 'Jacadi', '6-12 mois', 'Mixte', 'Hiver', 'Très bon état', 15, 'Beige', 's3', { ph: 'photo · gigoteuse' }),
  P(9, 'unique', 'Ciré jaune doublé', 'Petit Bateau', '6-8 ans', 'Mixte', 'Printemps', 'Très bon état', 20, 'Jaune', 's1', { washed: true, ph: 'photo · ciré' }),
  P(10, 'lot', 'Lot hiver 12 pièces', 'Kiabi', '6-12 mois', 'Mixte', 'Hiver', 'Bon état', 30, 'Bleu', 's2', { washed: true, count: 12, contents: [{ n: 'Bodies', q: 4 }, { n: 'Pantalons', q: 3 }, { n: 'Pulls', q: 3 }, { n: 'Combinaisons', q: 2 }], ph: 'photo · lot hiver' }),
  P(11, 'unique', 'Chemise à carreaux', 'Cyrillus', '6-8 ans', 'Garçon', 'Printemps', 'Neuf avec étiquette', 12, 'Bleu', 's3', { ph: 'photo · chemise' }),
  P(12, 'unique', 'Gilet en maille écru', 'Bonton', '2-4 ans', 'Mixte', 'Automne', 'Très bon état', 16, 'Blanc', 's4', { washed: true, ph: 'photo · gilet' }),
  P(13, 'lot', 'Lot fille 6 pièces mi-saison', 'Jacadi', '2-4 ans', 'Fille', 'Printemps', 'Très bon état', 26, 'Rose', 's1', { washed: true, count: 6, contents: [{ n: 'Robes', q: 2 }, { n: 'Leggings', q: 2 }, { n: 'Gilets', q: 2 }], ph: 'photo · lot mi-saison' }),
  P(14, 'unique', 'Combinaison pilote', 'Petit Bateau', '6-12 mois', 'Garçon', 'Hiver', 'Bon état', 19, 'Marine', 's4', { ph: 'photo · combinaison' }),
  P(15, 'unique', 'Baskets à scratch', 'Geox', '2-4 ans', 'Mixte', 'Toutes saisons', 'Très bon état', 14, 'Bleu', 's1', { category: 'chaussures', shoeSize: 25, size: 'Pointure 25', washed: true, ph: 'photo · baskets' }),
  P(16, 'unique', 'Bottes de pluie', 'Aigle', '4-6 ans', 'Mixte', 'Automne', 'Bon état', 9, 'Jaune', 's3', { category: 'chaussures', shoeSize: 28, size: 'Pointure 28', ph: 'photo · bottes' }),
  P(17, 'unique', 'Chaussons en cuir souple', 'Robeez', '6-12 mois', 'Mixte', 'Toutes saisons', 'Très bon état', 8, 'Beige', 's2', { category: 'chaussures', shoeSize: 19, size: 'Pointure 19', ph: 'photo · chaussons' }),
  P(18, 'lot', 'Lot 6 paires de chaussettes', 'Petit Bateau', '2-4 ans', 'Mixte', 'Toutes saisons', 'Très bon état', 6, 'Multicolore', 's4', { category: 'chaussettes', sockSize: '23-26', size: 'T. 23-26', count: 6, contents: [{ n: 'Paires de chaussettes', q: 6 }], washed: true, ph: 'photo · chaussettes' }),
  P(19, 'lot', 'Lot 3 collants fille', 'DPAM', '4-6 ans', 'Fille', 'Hiver', 'Bon état', 7, 'Rose', 's2', { category: 'chaussettes', sockSize: '27-30', size: 'T. 27-30', count: 3, contents: [{ n: 'Collants', q: 3 }], ph: 'photo · collants' }),
  P(15, 'unique', 'Pantalon en velours', 'Cyrillus', '2-4 ans', 'Garçon', 'Automne', 'Bon état', 9, 'Beige', 's2', { ph: 'photo · pantalon' }),
  P(16, 'lot', 'Lot sport garçon 5 pièces', 'Kiabi', '8-10 ans', 'Garçon', 'Toutes saisons', 'Satisfaisant', 12, 'Marine', 's3', { washed: true, count: 5, contents: [{ n: 'Joggings', q: 2 }, { n: 'T-shirts techniques', q: 3 }], ph: 'photo · lot sport' }),
];

// Listings already in Élodie's own dressing (sold, so not in the public feed).
export const MY_PAST_LISTINGS: Product[] = [
  { id: 101, type: 'unique', title: 'Gilet en maille rose', brand: 'Bonton', age: '2-4 ans', size: '2-4 ans', gender: 'Fille', season: 'Automne', condition: 'Très bon état', price: 14, color: 'Rose', sid: 'me', ph: 'photo · gilet' },
  { id: 102, type: 'lot', title: 'Lot 5 bodies 3 mois', brand: 'Petit Bateau', age: '0-6 mois', size: '0-6 mois', gender: 'Mixte', season: 'Toutes saisons', condition: 'Bon état', price: 12, color: 'Blanc', sid: 'me', count: 5, contents: [{ n: 'Bodies', q: 5 }], ph: 'photo · bodies' },
];

export const REVIEWS = [
  { who: 'Marion L.', stars: '★★★★★', text: 'Lot conforme, tout était plié et lavé. Envoi rapide.', when: 'il y a 3 jours' },
  { who: 'Thomas D.', stars: '★★★★★', text: 'Vendeuse très arrangeante pour la remise en main propre.', when: 'il y a 2 semaines' },
  { who: 'Aïcha K.', stars: '★★★★☆', text: 'Bon état comme décrit, un petit bouton à recoudre.', when: 'le mois dernier' },
];

export type DeliveryId = 'relais' | 'domicile' | 'main';

export const DELIVERY: { id: DeliveryId; title: string; sub: string; price: number; name: string }[] = [
  { id: 'relais', title: 'Point relais', sub: '2 à 4 jours', price: 3.9, name: 'Point relais' },
  { id: 'domicile', title: 'À domicile', sub: '2 à 3 jours', price: 5.9, name: 'Domicile' },
  { id: 'main', title: 'Main propre', sub: 'Rendez-vous avec le vendeur', price: 0, name: 'Main propre' },
];

export const DELIVERY_DETAIL: Record<DeliveryId, string> = {
  relais: 'Relais Tabac du Parc, 12 rue Oberkampf, Paris 11e · Modifier',
  domicile: 'Élodie Martin, 34 avenue Parmentier, 75011 Paris',
  main: "Tu fixeras le lieu et l'heure avec le vendeur dans la messagerie.",
};

export const SELL_DELIVERY: { id: DeliveryId; title: string; sub: string }[] = [
  { id: 'relais', title: 'Point relais', sub: "Tu déposes le colis, l'étiquette est générée" },
  { id: 'domicile', title: 'Domicile', sub: "Livré chez l'acheteur" },
  { id: 'main', title: 'Remise en main propre', sub: 'Rendez-vous fixé par message' },
];

export const DEFAULT_COMMISSION = 8;

/** Remise en main propre: busy, public places suggested near the user. */
export const SAFE_SPOTS = [
  { id: 'boulangerie', name: 'Boulangerie Le Pain d\'Antan', addr: '28 rue Oberkampf', dist: '350 m' },
  { id: 'mairie', name: 'Parvis de la mairie du 11e', addr: 'Place Léon-Blum', dist: '900 m' },
  { id: 'relais', name: 'Relais Tabac du Parc', addr: '12 rue Oberkampf', dist: '400 m' },
];

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
