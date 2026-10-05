import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

// Fixed colours, like the onboarding illustrations: the tree reads the same in light and dark mode.
const T = {
  soil: '#b98a5e', seed: '#8c491a', bark: '#7a4b2a', barkLight: '#8c5a35', acorn: '#b2622d',
  grass: '#ccdbb2', light: '#aebf92', mid: '#8fa073', leaf: '#728157', deep: '#56633f', flower: '#f6a06b', sun: '#f3d58a',
};

function Oak() {
  return (
    <>
      <Path d="M44 84 L46 62 L39 52 L43 50 L49 57 L49 46 L53 46 L54 57 L60 49 L64 51 L57 62 L58 84 Z" fill={T.bark} />
      <Circle cx={32} cy={46} r={15} fill={T.mid} />
      <Circle cx={68} cy={45} r={16} fill={T.mid} />
      <Circle cx={50} cy={38} r={22} fill={T.leaf} />
      <Circle cx={41} cy={29} r={13} fill={T.light} />
      <Circle cx={60} cy={28} r={12} fill={T.light} />
      <Circle cx={50} cy={52} r={11} fill={T.mid} />
      <Circle cx={36} cy={53} r={3} fill={T.acorn} />
      <Circle cx={64} cy={55} r={3} fill={T.acorn} />
      <Circle cx={57} cy={37} r={3} fill={T.acorn} />
    </>
  );
}

function Pine({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <G transform={`translate(${x} 84) scale(${s})`}>
      <Rect x={-1.8} y={-12} width={3.6} height={12} fill={T.bark} />
      <Path d="M0 -46 L11 -26 L-11 -26 Z" fill={T.leaf} />
      <Path d="M0 -36 L14 -12 L-14 -12 Z" fill={T.deep} />
    </G>
  );
}

/** The impact tree at a stage (0 graine · 1 pousse · 2 jeune arbre · 3 grand chêne · 4 forêt). */
export function ImpactTree({ stage, size = 120, bg }: { stage: number; size?: number; bg?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {bg && <Circle cx={50} cy={50} r={50} fill={bg} />}
      {stage >= 3 && <Circle cx={82} cy={18} r={7} fill={T.sun} />}
      <Ellipse cx={50} cy={85} rx={stage >= 4 ? 44 : 32} ry={6} fill={T.grass} />

      {stage === 0 && (
        <>
          <Path d="M33 86 Q50 66 67 86 Z" fill={T.soil} />
          <Ellipse cx={50} cy={77} rx={5} ry={3.4} fill={T.seed} transform="rotate(-20 50 77)" />
          <Path d="M51 74 Q51 68 56 66" stroke={T.mid} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </>
      )}

      {stage === 1 && (
        <>
          <Path d="M50 85 L50 58" stroke={T.deep} strokeWidth={3.2} strokeLinecap="round" />
          <Path d="M50 68 C50 58 42 53 32 55 C32 64 40 70 50 68 Z" fill={T.leaf} />
          <Path d="M50 61 C50 51 58 45 68 47 C68 57 60 63 50 61 Z" fill={T.mid} />
          <Path d="M40 85 L60 85" stroke={T.deep} strokeWidth={3} strokeLinecap="round" />
        </>
      )}

      {stage === 2 && (
        <>
          <Rect x={47} y={56} width={6} height={29} rx={2} fill={T.barkLight} />
          <Path d="M50 68 L58 61" stroke={T.barkLight} strokeWidth={3} strokeLinecap="round" />
          <Circle cx={39} cy={50} r={11} fill={T.mid} />
          <Circle cx={61} cy={49} r={11} fill={T.mid} />
          <Circle cx={50} cy={40} r={15} fill={T.leaf} />
          <Circle cx={45} cy={34} r={7} fill={T.light} />
          <Circle cx={30} cy={84} r={2.2} fill={T.flower} />
        </>
      )}

      {stage === 3 && <Oak />}

      {stage >= 4 && (
        <>
          <Pine x={15} s={0.9} />
          <Pine x={85} s={1} />
          <G transform="translate(50 84) scale(0.8) translate(-50 -84)"><Oak /></G>
          <Pine x={28} s={0.55} />
          <Pine x={72} s={0.6} />
          <Circle cx={38} cy={86} r={2.2} fill={T.flower} />
          <Circle cx={64} cy={87} r={2.2} fill={T.flower} />
        </>
      )}
    </Svg>
  );
}
