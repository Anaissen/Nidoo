// Organic design system tokens (project/_ds/organic…/styles.css), ported to React Native.

export const colors = {
  bg: '#f5ead8',
  surface: '#ebddc5',
  text: '#201e1d',
  accent: '#c67139',
  accent2: '#7a8a5e',
  divider: 'rgba(32,30,29,0.16)',
  scrim: 'rgba(46,43,37,0.45)',

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
} as const;

export const fonts = {
  heading: 'Caprasimo_400Regular',
  body: 'Figtree_400Regular',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
  mono: 'Menlo',
} as const;

export const shadows = {
  sm: '0px 1px 2px rgba(46,43,37,0.14)',
  md: '0px 3px 10px rgba(46,43,37,0.16)',
  lg: '0px 12px 32px rgba(46,43,37,0.22)',
} as const;

// Icons: Lucide at stroke-width 2.75 (design-system rule).
export const ICON_STROKE = 2.75;

// Horizontal page gutter used across every screen of the prototype.
export const GUTTER = 20;
