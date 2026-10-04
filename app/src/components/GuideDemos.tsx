// Small hands-on demos for the "Comment ça marche" guide. Each calls `onDone` once the person has tried it.
import { Check, Layers, ShieldCheck, Shirt } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { fmt } from '../lib/format';
import { commissionRate, useStore } from '../store/useStore';
import { colors, ICON_STROKE, shadows } from '../theme/tokens';
import { Chip, H, PrimaryButton, Segmented, Stripes, Txt } from './ui';

type DemoProps = { onDone: () => void };

/** Pops in when it mounts or when `k` changes. */
function Pop({ k, children }: { k: string | number; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 6, tension: 120 }).start();
  }, [k, v]);
  return <Animated.View style={{ opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>{children}</Animated.View>;
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <View style={{ padding: 16, borderRadius: 28, backgroundColor: colors.neutral100, boxShadow: shadows.sm, gap: 14 }}>{children}</View>
);

const MiniTile = ({ tones, title, sub, badge }: { tones: [string, string]; title: string; sub: string; badge?: string }) => (
  <View style={{ flex: 1, gap: 4 }}>
    <Stripes tones={tones} style={{ aspectRatio: 1, borderTopLeftRadius: 60, borderTopRightRadius: 60, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}>
      {badge && <View style={{ position: 'absolute', bottom: 8, right: 8, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, backgroundColor: colors.accent2_700 }}><Txt size={10} weight="bold" color={colors.neutral100}>{badge}</Txt></View>}
    </Stripes>
    <Txt size={13} weight="semi" numberOfLines={1}>{title}</Txt>
    <Txt size={11} color={colors.neutral700}>{sub}</Txt>
  </View>
);

// 1 · Choose the child ──────────────────────────────────────────────────────

const DEMO_FEED = {
  Léa: { avatar: '🦊', size: '2-4 ans', items: [['Robe en lin', '18,00 €', ['#ffe1d0', '#fff2eb']], ['Gilet écru', '16,00 €', ['#eee7db', '#f9f4ed']]] },
  Tom: { avatar: '🐻', size: '6-12 mois', items: [['Gigoteuse', '15,00 €', ['#dcd3c4', '#eee7db']], ['Lot hiver', '30,00 €', ['#e1eecc', '#f0fae1']]] },
} as const;

export function KidDemo({ onDone }: DemoProps) {
  const [kid, setKid] = useState<'Léa' | 'Tom'>('Léa');
  const feed = DEMO_FEED[kid];
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['Léa', 'Tom'] as const).map((k) => {
          const on = k === kid;
          return (
            <Pressable key={k} onPress={() => { setKid(k); if (k === 'Tom') onDone(); }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingLeft: 6, paddingRight: 14, borderRadius: 999, backgroundColor: on ? colors.text : colors.bg, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: k === 'Léa' ? colors.accent300 : colors.accent2_300, alignItems: 'center', justifyContent: 'center' }}><Txt size={18} lh={1.15}>{DEMO_FEED[k].avatar}</Txt></View>
              <View>
                <Txt size={14} weight="bold" lh={1.1} color={on ? colors.bg : colors.text}>{k}</Txt>
                <Txt size={11} lh={1.1} color={on ? colors.bg : colors.text}>{DEMO_FEED[k].size}</Txt>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Pop k={kid}>
        <View style={{ gap: 10 }}>
          <Txt size={13} color={colors.neutral800}>Pour {kid}, en {feed.size} :</Txt>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {feed.items.map(([t, p, tones]) => <MiniTile key={t} tones={tones as unknown as [string, string]} title={t} sub={p} badge={t.startsWith('Lot') ? 'Lot · 12' : undefined} />)}
          </View>
        </View>
      </Pop>
    </Card>
  );
}

// 2 · Single piece or lot ──────────────────────────────────────────────────

export function LotDemo({ onDone }: DemoProps) {
  const [t, setT] = useState<'unique' | 'lot'>('unique');
  const lot = t === 'lot';
  return (
    <Card>
      <Segmented options={[['unique', 'Pièce unique'], ['lot', 'Un lot']]} value={t} onChange={(v) => { setT(v); if (v === 'lot') onDone(); }} />
      <Pop k={t}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: lot ? colors.accent2_300 : colors.accent300, alignItems: 'center', justifyContent: 'center' }}>
            {lot ? <Layers size={30} strokeWidth={ICON_STROKE} color={colors.text} /> : <Shirt size={30} strokeWidth={ICON_STROKE} color={colors.text} />}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt weight="bold">{lot ? 'Lot naissance · 10 pièces' : 'Robe en lin smockée'}</Txt>
            <H size={22}>{lot ? '28,00 €' : '18,00 €'}</H>
            <Txt size={13} color={lot ? colors.accent2_700 : colors.neutral700} weight={lot ? 'semi' : 'regular'}>
              {lot ? 'soit 2,80 € la pièce, tout le lot ensemble' : 'Un vêtement, une annonce'}
            </Txt>
          </View>
        </View>
      </Pop>
    </Card>
  );
}

// 3 · Make an offer ─────────────────────────────────────────────────────────

export function OfferDemo({ onDone }: DemoProps) {
  const [offer, setOffer] = useState<number | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const send = (n: number) => {
    setOffer(n); setReply(null);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setReply(n >= 26 ? `C'est d'accord pour ${fmt(n)} !` : `Je peux descendre à ${fmt((n + 30) / 2)}, ça te va ?`);
      onDone();
    }, 900);
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt weight="semi">Lot hiver 12 pièces</Txt>
        <H size={20}>30,00 €</H>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[27, 24, 21].map((n) => (
          <Pressable key={n} onPress={() => send(n)} style={({ pressed }) => ({ flex: 1, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: offer === n ? colors.text : colors.bg, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
            <Txt weight="bold" color={offer === n ? colors.bg : colors.text}>{fmt(n)}</Txt>
          </Pressable>
        ))}
      </View>
      {offer != null && (
        <Pop k={`o${offer}`}>
          <View style={{ alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, borderBottomRightRadius: 6, backgroundColor: colors.accent }}>
            <Txt color={colors.bg}>Je te propose {fmt(offer)}</Txt>
          </View>
        </Pop>
      )}
      {offer != null && !reply && <Txt size={13} color={colors.neutral700}>Le vendeur écrit…</Txt>}
      {reply && (
        <Pop k={reply}>
          <View style={{ alignSelf: 'flex-start', maxWidth: '85%', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, borderBottomLeftRadius: 6, backgroundColor: colors.surface }}>
            <Txt>{reply}</Txt>
          </View>
        </Pop>
      )}
    </Card>
  );
}

// 4 · Protected payment ─────────────────────────────────────────────────────

const SAFE_STEPS = [
  ['Tu paies', 'Ton argent est mis de côté par Pimou'],
  ['Le vendeur expédie', 'Point relais, domicile ou main propre'],
  ['Tu reçois et tu confirmes', 'Tu vérifies que tout est conforme'],
  ['Le vendeur est payé', 'Seulement maintenant'],
];

export function SafeDemo({ onDone }: DemoProps) {
  const [i, setI] = useState(0);
  return (
    <Card>
      {SAFE_STEPS.map(([t, sub], n) => {
        const done = n <= i;
        return (
          <View key={t} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', opacity: done ? 1 : 0.45 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: done ? colors.accent2_600 : colors.bg, borderWidth: 3, borderColor: done ? colors.accent2_600 : colors.neutral400, alignItems: 'center', justifyContent: 'center' }}>
              <Check size={13} strokeWidth={4} color={colors.bg} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold">{t}</Txt>
              <Txt size={12} color={colors.neutral700}>{sub}</Txt>
            </View>
          </View>
        );
      })}
      {i < 3 ? (
        <PrimaryButton label="Étape suivante" height={44} size={15} onPress={() => { const n = i + 1; setI(n); if (n === 3) onDone(); }} />
      ) : (
        <Pop k="safe">
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 18, backgroundColor: colors.accent2_100 }}>
            <ShieldCheck size={20} strokeWidth={ICON_STROKE} color={colors.accent2_800} />
            <Txt size={13} weight="semi" color={colors.accent2_800} style={{ flex: 1 }}>Si le colis ne correspond pas, on te rembourse.</Txt>
          </View>
        </Pop>
      )}
    </Card>
  );
}

// 5 · Sell ──────────────────────────────────────────────────────────────────

export function SellDemo({ onDone }: DemoProps) {
  const pct = useStore((s) => s.commission);
  const [price, setPrice] = useState<number | null>(null);
  return (
    <Card>
      <Txt size={13} color={colors.neutral800}>Ton lot de bodies 3 mois, à combien ?</Txt>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {[10, 15, 20, 25].map((n) => <Chip key={n} label={`${n} €`} on={price === n} onPress={() => { setPrice(n); onDone(); }} />)}
      </View>
      {price != null && (
        <Pop k={price}>
          <View style={{ padding: 14, borderRadius: 20, backgroundColor: colors.surface, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt weight="bold">Tu recevras</Txt>
              <Txt weight="bold" color={colors.accent2_700}>{fmt(price * (1 - commissionRate(pct)))}</Txt>
            </View>
          </View>
        </Pop>
      )}
    </Card>
  );
}
