// Demo catalogue, copied from the Claude Design prototype (Nidoo.dc.html).

export const AGES = ['0-6 mois', '6-12 mois', '1-2 ans', '2-4 ans', '4-6 ans', '6-8 ans', '8-10 ans'] as const;
export const GENDERS = ['Fille', 'Garçon', 'Mixte'] as const;
export const SEASONS = ['Printemps', 'Été', 'Automne', 'Hiver', 'Toutes saisons'] as const;
export const CONDS = ['Neuf avec étiquette', 'Très bon état', 'Bon état', 'Satisfaisant'] as const;

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
};

export const SELLERS: Record<string, Seller> = {
  s1: { id: 's1', name: 'Camille R.', city: 'Lyon 6e', rating: '4,9', reviews: 86, sales: 128, init: 'C', since: '2024', ship: '24 h' },
  s2: { id: 's2', name: 'Julie M.', city: 'Nantes', rating: '4,8', reviews: 41, sales: 64, init: 'J', since: '2025', ship: '48 h' },
  s3: { id: 's3', name: 'Sophie & Marc', city: 'Bordeaux', rating: '5,0', reviews: 19, sales: 22, init: 'S', since: '2025', ship: '24 h' },
  s4: { id: 's4', name: 'Inès B.', city: 'Lille', rating: '4,7', reviews: 33, sales: 41, init: 'I', since: '2023', ship: '72 h' },
  me: { id: 'me', name: 'Élodie', city: 'Paris 11e', rating: '4,9', reviews: 12, sales: 18, init: 'É', since: '2025', ship: '24 h' },
};

export type ListingType = 'lot' | 'unique';
export type LotLine = { n: string; q: number };

export type Product = {
  id: number; type: ListingType; title: string; brand: string; age: string; size: string;
  gender: string; season: string; condition: string; price: number; color: string; sid: string;
  count?: number; contents?: LotLine[]; ph?: string;
};

const P = (
  id: number, type: ListingType, title: string, brand: string, age: string, gender: string,
  season: string, condition: string, price: number, color: string, sid: string,
  extra: Partial<Product> = {},
): Product => ({ id, type, title, brand, age, size: age, gender, season, condition, price, color, sid, ...extra });

export const PRODUCTS: Product[] = [
  P(1, 'lot', 'Lot naissance 10 bodies & pyjamas', 'Petit Bateau', '0-6 mois', 'Mixte', 'Toutes saisons', 'Très bon état', 28, 'Blanc', 's1', { count: 10, contents: [{ n: 'Bodies manches longues', q: 5 }, { n: 'Pyjamas velours', q: 3 }, { n: 'Bonnets', q: 2 }], ph: 'photo · lot plié à plat' }),
  P(2, 'unique', 'Robe en lin smockée', 'Jacadi', '2-4 ans', 'Fille', 'Été', 'Neuf avec étiquette', 18, 'Rose', 's2', { ph: 'photo · robe de face' }),
  P(3, 'lot', 'Lot rentrée garçon 7 pièces', 'Okaïdi', '4-6 ans', 'Garçon', 'Automne', 'Bon état', 32, 'Marine', 's3', { count: 7, contents: [{ n: 'Pantalons', q: 2 }, { n: 'Sweats', q: 2 }, { n: 'T-shirts manches longues', q: 3 }], ph: 'photo · lot rentrée' }),
  P(4, 'unique', 'Doudoune légère sans manches', 'Cyrillus', '4-6 ans', 'Mixte', 'Hiver', 'Très bon état', 22, 'Bleu', 's1', { ph: 'photo · doudoune' }),
  P(5, 'lot', "Lot 4 pyjamas d'hiver", 'Petit Bateau', '1-2 ans', 'Mixte', 'Hiver', 'Bon état', 16, 'Beige', 's4', { count: 4, contents: [{ n: 'Pyjamas une pièce', q: 4 }], ph: 'photo · pyjamas' }),
  P(6, 'unique', 'Salopette en velours côtelé', 'Bonton', '1-2 ans', 'Fille', 'Automne', 'Très bon état', 14, 'Vert', 's2', { ph: 'photo · salopette' }),
  P(7, 'lot', 'Lot été fille 9 pièces', "Tape à l'œil", '8-10 ans', 'Fille', 'Été', 'Bon état', 25, 'Multicolore', 's4', { count: 9, contents: [{ n: 'Shorts', q: 3 }, { n: 'T-shirts', q: 4 }, { n: 'Robes', q: 2 }], ph: 'photo · lot été' }),
  P(8, 'unique', 'Gigoteuse 6-18 mois', 'Jacadi', '6-12 mois', 'Mixte', 'Hiver', 'Très bon état', 15, 'Beige', 's3', { ph: 'photo · gigoteuse' }),
  P(9, 'unique', 'Ciré jaune doublé', 'Petit Bateau', '6-8 ans', 'Mixte', 'Printemps', 'Très bon état', 20, 'Jaune', 's1', { ph: 'photo · ciré' }),
  P(10, 'lot', 'Lot hiver 12 pièces', 'Kiabi', '6-12 mois', 'Mixte', 'Hiver', 'Bon état', 30, 'Bleu', 's2', { count: 12, contents: [{ n: 'Bodies', q: 4 }, { n: 'Pantalons', q: 3 }, { n: 'Pulls', q: 3 }, { n: 'Combinaisons', q: 2 }], ph: 'photo · lot hiver' }),
  P(11, 'unique', 'Chemise à carreaux', 'Cyrillus', '6-8 ans', 'Garçon', 'Printemps', 'Neuf avec étiquette', 12, 'Bleu', 's3', { ph: 'photo · chemise' }),
  P(12, 'unique', 'Gilet en maille écru', 'Bonton', '2-4 ans', 'Mixte', 'Automne', 'Très bon état', 16, 'Blanc', 's4', { ph: 'photo · gilet' }),
  P(13, 'lot', 'Lot fille 6 pièces mi-saison', 'Jacadi', '2-4 ans', 'Fille', 'Printemps', 'Très bon état', 26, 'Rose', 's1', { count: 6, contents: [{ n: 'Robes', q: 2 }, { n: 'Leggings', q: 2 }, { n: 'Gilets', q: 2 }], ph: 'photo · lot mi-saison' }),
  P(14, 'unique', 'Combinaison pilote', 'Petit Bateau', '6-12 mois', 'Garçon', 'Hiver', 'Bon état', 19, 'Marine', 's4', { ph: 'photo · combinaison' }),
  P(15, 'unique', 'Pantalon en velours', 'Cyrillus', '2-4 ans', 'Garçon', 'Automne', 'Bon état', 9, 'Beige', 's2', { ph: 'photo · pantalon' }),
  P(16, 'lot', 'Lot sport garçon 5 pièces', 'Kiabi', '8-10 ans', 'Garçon', 'Toutes saisons', 'Satisfaisant', 12, 'Marine', 's3', { count: 5, contents: [{ n: 'Joggings', q: 2 }, { n: 'T-shirts techniques', q: 3 }], ph: 'photo · lot sport' }),
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

export type Kid = { name: string; age: string; g: string; init: string; avatar: string; prev: string };

export const KIDS: Kid[] = [
  { name: 'Léa', age: '2-4 ans', g: 'Fille', init: 'L', avatar: '#ffc6a5', prev: '1-2 ans' },
  { name: 'Tom', age: '6-12 mois', g: 'Garçon', init: 'T', avatar: '#ccdbb2', prev: '0-6 mois' },
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
