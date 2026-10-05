import { Image, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../theme/tokens';

const WORDMARK = require('../../assets/logo-wordmark.png');
const FULL = require('../../assets/logo-full.png');
const WORDMARK_RATIO = 1030 / 315;
const FULL_RATIO = 1030 / 912;

/** A little sage sprig: curved stem with four soft leaves (decoration, e.g. on the passport). */
export function Sprig({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 22c1.2-5.6 4-10.6 10-16" stroke={colors.accent2_700} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Path d="M15.5 6.5C15.4 3.3 17.9 1 21.5 1.2c.3 3.4-2.3 6-6 5.3Z" fill={colors.accent2_500} />
      <Path d="M10.8 11.6C7.6 11.3 5.6 8.6 6.1 5.4c3.3.3 5.4 3 4.7 6.2Z" fill={colors.accent2_400} />
      <Path d="M11.9 12.4c2.8-1.8 6.1-1.2 7.8 1.5-2.8 1.8-6.1 1.2-7.8-1.5Z" fill={colors.accent2_600} />
      <Path d="M8.3 16.8c-2.6-.2-4.3-2.3-4-4.9 2.6.2 4.3 2.4 4 4.9Z" fill={colors.accent2_500} />
    </Svg>
  );
}

/** Colourful "Pimou" lettering from the brand logo. `size` ≈ the height of a matching text title. */
export function Logo({ size = 24 }: { size?: number }) {
  const height = Math.round(size * 1.25);
  return (
    <View accessibilityRole="header" accessibilityLabel="Pimou">
      <Image source={WORDMARK} style={{ height, width: height * WORDMARK_RATIO }} resizeMode="contain" />
    </View>
  );
}

/** Full brand logo: the bear in its cart, "Pimou" and the tagline. */
export function FullLogo({ width }: { width: number }) {
  return <Image source={FULL} accessibilityLabel="Pimou, la marketplace des enfants" style={{ width, height: width / FULL_RATIO }} resizeMode="contain" />;
}
