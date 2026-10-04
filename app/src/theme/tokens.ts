// Organic design system tokens (project/_ds/organic…/styles.css), ported to React Native,
// plus a dark palette built on the same ramp logic (tints become deep fills, deep steps become light text).

const light = {
  bg: '#f5ead8',
  surface: '#ebddc5',
  text: '#201e1d',
  accent: '#c67139',
  accent2: '#7a8a5e',
  divider: 'rgba(32,30,29,0.16)',
  scrim: 'rgba(46,43,37,0.45)',
  /** Fixed dark ink for text on pastel fills (avatars, photo placeholders) in both themes. */
  ink: '#201e1d',
  /** Selected option lifted out of a segmented track. */
  raised: '#f9f4ed',

  neutral100: '#f9f4ed',
  neutral200: '#eee7db',
  neutral300: '#dcd3c4',
  neutral400: '#c0b6a5',
  neutral500: '#a19786',
  neutral600: '#82796a',
  neutral700: '#645c50',
  neutral800: '#474238',
  neutral900: '#2e2b25',

  accent100: '#fff2eb',
  accent200: '#ffe1d0',
  accent300: '#ffc6a5',
  accent400: '#f6a06b',
  accent500: '#d67f48',
  accent600: '#b2622d',
  accent700: '#8c491a',
  accent800: '#643312',
  accent900: '#402310',

  accent2_100: '#f0fae1',
  accent2_200: '#e1eecc',
  accent2_300: '#ccdbb2',
  accent2_400: '#aebf92',
  accent2_500: '#8fa073',
  accent2_600: '#728157',
  accent2_700: '#56633f',
  accent2_800: '#3d472b',
  accent2_900: '#272e1b',
};

type Palette = typeof light;

const dark: Palette = {
  bg: '#1b1916',
  surface: '#2b2723',
  text: '#f3eadb',
  accent: '#d67f48',
  accent2: '#8fa073',
  divider: 'rgba(243,234,219,0.14)',
  scrim: 'rgba(0,0,0,0.6)',
  ink: '#201e1d',
  raised: '#4a433c',

  neutral100: '#24211d',
  neutral200: '#302b26',
  neutral300: '#3e3832',
  neutral400: '#5a534b',
  neutral500: '#7d7468',
  neutral600: '#9c9283',
  neutral700: '#b8ad9c',
  neutral800: '#d4c9b7',
  neutral900: '#ece3d4',

  accent100: '#3a2619',
  accent200: '#4a2e1c',
  accent300: '#6b3f22',
  accent400: '#9a5a2f',
  accent500: '#c67139',
  accent600: '#e08a52',
  accent700: '#f6a06b',
  accent800: '#ffc6a5',
  accent900: '#ffe1d0',

  accent2_100: '#232a1b',
  accent2_200: '#2e3723',
  accent2_300: '#3f4b2f',
  accent2_400: '#56663f',
  accent2_500: '#6b7b50',
  accent2_600: '#8fa073',
  accent2_700: '#aebf92',
  accent2_800: '#ccdbb2',
  accent2_900: '#e1eecc',
};

/** Live palette. Mutated in place by `applyTheme`; screens re-mount after a change (see app/_layout). */
export const colors: Palette = { ...light };

export const shadows = {
  sm: '0px 1px 2px rgba(46,43,37,0.14)',
  md: '0px 3px 10px rgba(46,43,37,0.16)',
  lg: '0px 12px 32px rgba(46,43,37,0.22)',
};

const darkShadows = {
  sm: '0px 1px 2px rgba(0,0,0,0.45)',
  md: '0px 3px 10px rgba(0,0,0,0.5)',
  lg: '0px 12px 32px rgba(0,0,0,0.6)',
};
const lightShadows = { ...shadows };

/** Both palettes, for previews that must not change the live theme (guide demo). */
export const palettes = { light, dark };

/** Extra text magnification on top of the phone's own setting. */
export const typeScale = { value: 1 };

export function applyTheme(mode: 'light' | 'dark', scale: number) {
  Object.assign(colors, mode === 'dark' ? dark : light);
  Object.assign(shadows, mode === 'dark' ? darkShadows : lightShadows);
  typeScale.value = scale;
}

export const fonts = {
  heading: 'Caprasimo_400Regular',
  body: 'Figtree_400Regular',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
  mono: 'Menlo',
} as const;

// Icons: Lucide at stroke-width 2.75 (design-system rule).
export const ICON_STROKE = 2.75;

// Horizontal page gutter used across every screen of the prototype.
export const GUTTER = 20;
