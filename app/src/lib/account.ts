/** The person using the app. Stored on the device for now (no server yet). */
export type Account = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  zip: string;
  city: string;
};

/** Shown for installs that finished the onboarding before sign-up existed. */
export const DEMO_ACCOUNT: Account = {
  firstName: 'Élodie', lastName: 'Martin', email: 'elodie@exemple.fr', phone: '',
  street: '34 avenue Parmentier', zip: '75011', city: 'Paris',
};

export const EMPTY_ACCOUNT: Account = { firstName: '', lastName: '', email: '', phone: '', street: '', zip: '', city: '' };

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD = 8;

export const fullName = (a: Account) => `${a.firstName} ${a.lastName}`.trim();
export const shortName = (a: Account) => `${a.firstName}${a.lastName ? ` ${a.lastName[0].toUpperCase()}.` : ''}`;
export const initial = (a: Account) => (a.firstName || '?').slice(0, 1).toUpperCase();
export const addressLine = (a: Account) => `${fullName(a)}, ${a.street}, ${a.zip} ${a.city}`;
/** "Paris 11e" style label: city, plus the arrondissement for Paris / Lyon / Marseille. */
export function cityLabel(a: Account) {
  const m = /^(75|69|13)0?(\d{2})$/.exec(a.zip.trim());
  if (m && /paris|lyon|marseille/i.test(a.city)) return `${a.city} ${Number(m[2]) === 1 ? '1er' : `${Number(m[2])}e`}`;
  return a.city;
}

/** Delivery address filled in (needed for home delivery and the shipping label). */
export const hasAddress = (a: Account) => !!a.street.trim() && /^\d{5}$/.test(a.zip.trim()) && !!a.city.trim();

/** Demo only, until there's a server: never keep the password itself on the device. */
export function hashPassword(pw: string) {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h + pw.charCodeAt(i)) | 0;
  return 'h' + (h >>> 0).toString(36);
}

/** What's wrong with the form, field by field (empty object when it's fine). */
export function accountErrors(a: Account, opts: { requireAddress?: boolean } = {}) {
  const e: Partial<Record<keyof Account, string>> = {};
  if (!a.firstName.trim()) e.firstName = 'Ton prénom';
  if (!a.lastName.trim()) e.lastName = 'Ton nom';
  if (!EMAIL_RE.test(a.email.trim())) e.email = 'Une adresse e-mail valide';
  if (a.phone.trim() && a.phone.replace(/\D/g, '').length < 10) e.phone = 'Un numéro à 10 chiffres';
  if (opts.requireAddress !== false || a.street || a.zip || a.city) {
    if (!a.street.trim()) e.street = 'Ton adresse';
    if (!/^\d{5}$/.test(a.zip.trim())) e.zip = '5 chiffres';
    if (!a.city.trim()) e.city = 'Ta ville';
  }
  return e;
}
