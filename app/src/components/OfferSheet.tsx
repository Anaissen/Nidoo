import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Product } from '../data/catalog';
import { fmt } from '../lib/format';
import { useStore } from '../store/useStore';
import { colors, fonts, GUTTER, ICON_STROKE, shadows } from '../theme/tokens';
import { CircleButton, H, PrimaryButton, Txt } from './ui';

const round = (n: number) => Math.round(n * 2) / 2;
/** Offers below half the price are refused straight away. */
export const MIN_OFFER_RATIO = 0.5;

/** "Faire une offre": quick discounts or a custom amount, sent to the seller in the chat. */
export function OfferSheet({ p, visible, onClose }: { p: Product; visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const makeOffer = useStore((s) => s.makeOffer);
  const showToast = useStore((s) => s.showToast);
  const [txt, setTxt] = useState(String(round(p.price * 0.9)).replace('.', ','));
  const amount = parseFloat(txt.replace(',', '.')) || 0;
  const min = round(p.price * MIN_OFFER_RATIO);
  const quick = [0.95, 0.9, 0.85].map((r) => round(p.price * r));

  const send = () => {
    if (amount <= 0) { showToast('Indique un montant'); return; }
    if (amount >= p.price) { showToast('Ton offre doit être sous le prix affiché'); return; }
    if (amount < min) { showToast(`Offre trop basse : minimum ${fmt(min)}`); return; }
    const cid = makeOffer(p.id, amount);
    onClose();
    router.push(`/chat/${cid}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable onPress={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.scrim }} accessibilityLabel="Fermer" />
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 36, borderTopRightRadius: 36, boxShadow: shadows.lg, paddingHorizontal: GUTTER, paddingBottom: Math.max(insets.bottom, 16), gap: 16 }}>
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 40, height: 5, borderRadius: 999, backgroundColor: colors.neutral400 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <H size={24}>Faire une offre</H>
            <CircleButton size={40} onPress={onClose} accessibilityLabel="Fermer"><X size={18} strokeWidth={ICON_STROKE} color={colors.text} /></CircleButton>
          </View>
          <Txt size={14} color={colors.neutral800}>Prix affiché : <Txt size={14} weight="bold">{fmt(p.price)}</Txt>. Le vendeur peut accepter ou te proposer un autre prix.</Txt>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {quick.map((q) => {
              const on = q === amount;
              return (
                <Pressable key={q} onPress={() => setTxt(String(q).replace('.', ','))} style={{ flex: 1, height: 54, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.text : colors.neutral100 }}>
                  <Txt weight="bold" color={on ? colors.bg : colors.text}>{fmt(q)}</Txt>
                  <Txt size={11} color={on ? colors.neutral300 : colors.neutral700}>−{Math.round((1 - q / p.price) * 100)} %</Txt>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 72, paddingHorizontal: 22, borderRadius: 28, backgroundColor: colors.neutral100, borderWidth: 2, borderColor: colors.accent }}>
            <TextInput
              value={txt}
              onChangeText={(t) => setTxt(t.replace(/[^0-9.,]/g, ''))}
              keyboardType="decimal-pad"
              accessibilityLabel="Montant de l'offre"
              style={{ flex: 1, minWidth: 0, fontFamily: fonts.heading, fontSize: 34, color: colors.text, paddingVertical: 0, outlineWidth: 0 }}
            />
            <H size={28}>€</H>
          </View>
          {amount > 0 && amount < p.price && (
            <Txt size={13} color={colors.accent2_700} weight="semi">Tu économiserais {fmt(p.price - amount)}</Txt>
          )}

          <PrimaryButton label={`Envoyer mon offre · ${fmt(amount)}`} onPress={send} disabledLook={amount < min || amount >= p.price} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
