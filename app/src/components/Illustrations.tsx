import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

// Onboarding illustrations, drawn in the Organic palette. Fixed light colours: they sit on a light
// round badge in both themes, like the logo.
const C = {
  ink: '#201e1d', paper: '#f9f4ed',
  peach: '#ffc6a5', coral: '#f6a06b', terra: '#d67f48', rust: '#b2622d',
  sage: '#aebf92', moss: '#8fa073', leaf: '#728157', pine: '#56633f',
  kraft: '#e9c39a', kraftDark: '#d4a273', kraftLight: '#f3d9bb', sand: '#dcd3c4', butter: '#f3d58a',
};

/** "Une pièce ou tout un lot": a single dress on its hanger next to a tied bundle of folded clothes. */
export function PieceOrLotArt({ size = 260 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={100} fill="#f0fae1" />
      <Ellipse cx={100} cy={166} rx={78} ry={9} fill={C.sage} opacity={0.45} />

      {/* One piece: dress on a hanger */}
      <G transform="translate(58 98)">
        <Path d="M0 -40 L0 -48 Q0 -55 6 -55 Q12 -55 12 -49" stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d="M-26 -30 L0 -42 L26 -30" stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M-10 -32 L10 -32 L14 -8 L34 56 Q0 64 -34 56 L-14 -8 Z" fill={C.coral} />
        <Path d="M-14 -8 Q0 -2 14 -8" stroke={C.rust} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d="M-28 40 Q0 48 28 40" stroke={C.paper} strokeWidth={3} fill="none" strokeDasharray="1 6" strokeLinecap="round" />
        <Circle cx={-9} cy={16} r={3} fill={C.paper} /><Circle cx={8} cy={26} r={3} fill={C.paper} /><Circle cx={-2} cy={38} r={3} fill={C.paper} />
      </G>

      {/* "ou" */}
      <SvgText x={101} y={108} fontSize={15} fontWeight="700" fill={C.pine} textAnchor="middle">ou</SvgText>

      {/* A lot: three folded clothes tied with a ribbon */}
      <G transform="translate(146 0)">
        <Rect x={-34} y={128} width={68} height={26} rx={8} fill={C.moss} />
        <Rect x={-30} y={104} width={60} height={26} rx={8} fill={C.butter} />
        <Rect x={-32} y={80} width={64} height={26} rx={8} fill={C.peach} />
        <Path d="M-20 93 L20 93" stroke={C.terra} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
        <Path d="M-18 117 L18 117" stroke="#d9b44f" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
        <Rect x={-5} y={78} width={10} height={78} fill={C.terra} />
        <Ellipse cx={-11} cy={74} rx={11} ry={7} fill={C.rust} transform="rotate(-20 -11 74)" />
        <Ellipse cx={11} cy={74} rx={11} ry={7} fill={C.rust} transform="rotate(20 11 74)" />
        <Circle cx={0} cy={76} r={5} fill={C.terra} />
        {/* price tag */}
        <G transform="rotate(12 26 62)">
          <Path d="M18 50 L42 50 Q46 50 46 54 L46 70 Q46 74 42 74 L18 74 L10 62 Z" fill={C.paper} stroke={C.ink} strokeWidth={2} />
          <Circle cx={17} cy={62} r={2.5} fill={C.ink} />
          <SvgText x={32} y={66.5} fontSize={11} fontWeight="700" fill={C.ink} textAnchor="middle">LOT</SvgText>
        </G>
      </G>
    </Svg>
  );
}

/** "Simple et protégé": a parcel with a heart, guarded by a check-marked shield. */
export function ParcelArt({ size = 260 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={100} fill="#f9f4ed" />
      <Ellipse cx={96} cy={164} rx={70} ry={9} fill={C.sand} />

      {/* parcel */}
      <Path d="M44 84 L64 62 L156 62 L136 84 Z" fill={C.kraftLight} />
      <Path d="M136 84 L156 62 L156 138 L136 160 Z" fill={C.kraftDark} />
      <Rect x={44} y={84} width={92} height={76} fill={C.kraft} />
      <Path d="M82 84 L102 62 L116 62 L96 84 Z" fill={C.terra} opacity={0.85} />
      <Rect x={82} y={84} width={14} height={30} fill={C.terra} opacity={0.85} />
      <Path d="M68 132 C68 124 78 122 80 129 C82 122 92 124 92 132 C92 140 80 146 80 148 C80 146 68 140 68 132 Z" fill={C.rust} />
      <Path d="M108 140 L126 140 M108 148 L120 148" stroke={C.kraftDark} strokeWidth={3} strokeLinecap="round" />

      {/* shield */}
      <G transform="translate(148 118)">
        <Path d="M0 -30 L26 -20 L26 2 Q26 24 0 36 Q-26 24 -26 2 L-26 -20 Z" fill={C.leaf} stroke={C.paper} strokeWidth={4} strokeLinejoin="round" />
        <Path d="M-11 2 L-3 10 L12 -6" stroke={C.paper} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>

      {/* little motion sparks */}
      <Path d="M28 70 L38 70 M24 88 L34 88 M30 106 L38 106" stroke={C.moss} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={160} cy={42} r={5} fill={C.butter} />
      <Circle cx={40} cy={44} r={3.5} fill={C.coral} />
    </Svg>
  );
}

/** The pea-green dot next to the slides, with a little sprout so it doesn't look empty. */
export function SproutDot({ size = 72 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72">
      <Circle cx={36} cy={36} r={36} fill="#ccdbb2" />
      <Path d="M36 56 L36 32" stroke={C.pine} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M36 38 C36 28 28 22 18 24 C18 34 26 40 36 38 Z" fill={C.leaf} />
      <Path d="M36 32 C36 22 44 16 54 18 C54 28 46 34 36 32 Z" fill={C.moss} />
      <Path d="M26 56 L46 56" stroke={C.pine} strokeWidth={3.5} strokeLinecap="round" />
    </Svg>
  );
}
