import { router, useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';


import { openProduct, Thumb } from '../../components/products';
import { BackButton, BottomBar, Screen } from '../../components/Screen';
import { Avatar, ellipsis, H, OutlineButton, PrimaryButton, Txt } from '../../components/ui';
import { fmt } from '../../lib/format';
import { negotiation, respond, sendCounter } from '../../lib/messaging';
import { OfferKind, productById, sellerById, useStore } from '../../store/useStore';
import { colors, fonts, ICON_STROKE } from '../../theme/tokens';

const QUICK = ['Est-ce toujours disponible ?', 'Remise en main propre possible ?', "Tu as d'autres pièces dans cette taille ?"];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chat = useStore((s) => s.chats[id]);
  const typing = useStore((s) => s.typingCid === id);
  const mine = useStore((s) => s.mine);
  const send = useStore((s) => s.send);
  const addToCart = useStore((s) => s.addToCart);
  const offer = useStore((s) => (chat ? s.offers[chat.pid] : undefined));
  const acceptCounter = useStore((s) => s.acceptCounter);
  const markRead = useStore((s) => s.markRead);
  const showToast = useStore((s) => s.showToast);
  const [draft, setDraft] = useState('');
  const [counter, setCounter] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);

  const count = chat?.msgs.length ?? 0;
  useEffect(() => { scroll.current?.scrollToEnd({ animated: true }); }, [count, typing]);
  // While this conversation is on screen, incoming messages are read straight away.
  useEffect(() => {
    useStore.setState({ viewingCid: id });
    return () => { if (useStore.getState().viewingCid === id) useStore.setState({ viewingCid: null }); };
  }, [id]);
  const unread = !!chat?.unread;
  useEffect(() => { if (count) markRead(id); }, [count, unread, id, markRead]);

  const person = chat ? sellerById(chat.sid) : undefined;
  const p = chat ? productById(mine, chat.pid) : undefined;
  if (!chat || !person || !p) return <Screen><Txt style={{ padding: 20 }}>Conversation introuvable.</Txt></Screen>;

  const remote = chat.remote;
  const iSell = remote?.role === 'seller' || p.sid === 'me';
  // Real conversations: the other person's last proposal, still waiting for my answer.
  const n = remote ? negotiation(chat.msgs) : null;
  const toAnswer = n && !n.mine && (n.kind === 'offer' || n.kind === 'counter') ? n : null;

  const submit = (t: string) => { send(id, t); setDraft(''); };
  const answer = async (kind: 'accept' | 'decline') => { const err = await respond(id, kind); if (!err && kind === 'accept') showToast('Offre acceptée ✓'); };
  const submitCounter = async () => {
    const amount = parseFloat((counter ?? '').replace(',', '.'));
    if (!toAnswer) return;
    if (!(amount > toAnswer.amount) || amount >= p.price) { showToast(`Propose un prix entre ${fmt(toAnswer.amount)} et ${fmt(p.price)}`); return; }
    const err = await sendCounter(id, amount);
    if (!err) setCounter(null);
  };

  const bottom = (
    <BottomBar style={{ flexDirection: 'column', gap: 8, paddingTop: 10, paddingHorizontal: 16 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 6 }}>
        {QUICK.map((t) => (
          <Pressable key={t} onPress={() => submit(t)} style={{ height: 34, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.neutral100, justifyContent: 'center' }}>
            <Txt size={13}>{t}</Txt>
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => submit(draft)}
          returnKeyType="send"
          placeholder="Écris ton message…"
          placeholderTextColor={colors.neutral600}
          style={{ flex: 1, minWidth: 0, height: 48, borderRadius: 999, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.neutral100, paddingHorizontal: 18, fontFamily: fonts.body, fontSize: 15, color: colors.text, outlineWidth: 0 }}
        />
        <Pressable onPress={() => submit(draft)} accessibilityLabel="Envoyer" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Send size={20} strokeWidth={ICON_STROKE} color={colors.bg} />
        </Pressable>
      </View>
    </BottomBar>
  );

  return (
    <Screen ref={scroll} bottom={bottom} keyboard padBottom={16} contentStyle={{ paddingHorizontal: 16 }}>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4, paddingBottom: 8 }}>
          <BackButton />
          <Avatar init={person.init} size={40} font={16} />
          <View style={{ flex: 1 }}>
            <Txt weight="bold">{person.name}</Txt>
            <Txt size={12} color={colors.accent2_700}>{remote ? (iSell ? 'Intéressé·e par ton annonce' : person.city) : 'Répond en général en 1 h'}</Txt>
          </View>
        </View>

        <Pressable onPress={() => openProduct(p.id)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 10, borderRadius: 22, backgroundColor: colors.surface }}>
          <Thumb p={p} size={52} radius={16} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt size={14} weight="semi" {...ellipsis}>{p.title}</Txt>
            <Txt size={14} weight="bold">
              {offer?.status === 'accepted' ? `${fmt(offer.amount)} · offre acceptée` : fmt(p.price)}
            </Txt>
          </View>
          {!iSell && p.price > 0 && (
            <Pressable onPress={() => { addToCart(p.id); router.push('/cart'); }} style={{ height: 38, paddingHorizontal: 16, borderRadius: 999, backgroundColor: colors.accent, justifyContent: 'center' }}>
              <H size={14} color={colors.bg}>Acheter</H>
            </Pressable>
          )}
        </Pressable>

        <Txt size={12} color={colors.neutral600} style={{ textAlign: 'center', paddingVertical: 4 }}>Aujourd'hui</Txt>

        {chat.msgs.map((m, i) => m.offer ? (
          <OfferBubble key={m.id ?? i} me={m.me} kind={m.offer.kind} amount={m.offer.amount} listPrice={p.price} text={m.t}
            canAccept={!remote && m.offer.kind === 'counter' && offer?.status === 'countered' && offer.counter === m.offer.amount}
            onAccept={() => acceptCounter(p.id)} />
        ) : (
          <View
            key={i}
            style={{
              alignSelf: m.me ? 'flex-end' : 'flex-start', maxWidth: '78%', paddingVertical: 10, paddingHorizontal: 14,
              backgroundColor: m.me ? colors.accent : colors.surface,
              borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomLeftRadius: m.me ? 22 : 6, borderBottomRightRadius: m.me ? 6 : 22,
            }}
          >
            <Txt color={m.me ? colors.bg : colors.text}>{m.t}</Txt>
          </View>
        ))}
        {typing && (
          <View style={{ alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 22, backgroundColor: colors.surface }}>
            <Txt size={13} color={colors.neutral700}>{person.name} écrit…</Txt>
          </View>
        )}

        {toAnswer && (
          <View style={{ padding: 14, gap: 10, borderRadius: 22, backgroundColor: colors.accent100 }}>
            <Txt size={14} weight="semi">
              {toAnswer.kind === 'offer' ? `${person.name} te propose ${fmt(toAnswer.amount)} au lieu de ${fmt(p.price)}.` : `${person.name} te propose ${fmt(toAnswer.amount)}.`}
            </Txt>
            {counter == null ? (
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <PrimaryButton label={`Accepter ${fmt(toAnswer.amount)}`} height={42} size={15} onPress={() => answer('accept')} style={{ flexGrow: 1 }} />
                <OutlineButton label="Refuser" height={42} size={15} onPress={() => answer('decline')} style={{ paddingHorizontal: 18 }} />
                {toAnswer.kind === 'offer' && <OutlineButton label="Contre-offre" height={42} size={15} onPress={() => setCounter('')} style={{ paddingHorizontal: 18 }} />}
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TextInput
                  value={counter} onChangeText={(t) => setCounter(t.replace(/[^0-9,.]/g, ''))} autoFocus keyboardType="decimal-pad" placeholder="Ton prix (€)"
                  placeholderTextColor={colors.neutral600} accessibilityLabel="Ton prix"
                  style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 999, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.neutral100, paddingHorizontal: 16, fontFamily: fonts.body, fontSize: 15, color: colors.text, outlineWidth: 0 }}
                />
                <PrimaryButton label="Envoyer" height={44} size={15} onPress={submitCounter} style={{ paddingHorizontal: 18 }} />
                <Pressable onPress={() => setCounter(null)} hitSlop={8}><Txt size={14} color={colors.neutral700}>Annuler</Txt></Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}

const KIND_LABEL: Record<OfferKind, string> = { offer: 'Offre', counter: 'Contre-offre', accept: 'Accord', decline: 'Refusée' };

/** Price-offer card inside the conversation. */
function OfferBubble({ me, kind, amount, listPrice, text, canAccept, onAccept }: {
  me: boolean; kind: OfferKind; amount: number; listPrice: number; text: string; canAccept: boolean; onAccept: () => void;
}) {
  const done = kind === 'accept';
  const no = kind === 'decline';
  return (
    <View style={{ alignSelf: me ? 'flex-end' : 'flex-start', width: '72%', padding: 14, gap: 4, borderRadius: 22, borderWidth: 2, borderColor: done ? colors.accent2_500 : no ? colors.neutral400 : colors.accent, backgroundColor: done ? colors.accent2_100 : colors.neutral100, opacity: no ? 0.85 : 1 }}>
      <Txt size={11} weight="bold" color={done ? colors.accent2_800 : no ? colors.neutral700 : colors.accent700} style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>
        {KIND_LABEL[kind]}{done ? ' ✓' : ''}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <H size={24}>{fmt(amount)}</H>
        <Txt size={13} color={colors.neutral600} style={{ textDecorationLine: 'line-through' }}>{fmt(listPrice)}</Txt>
      </View>
      <Txt size={14} color={colors.neutral800}>{text}</Txt>
      {canAccept && <PrimaryButton label={`Accepter ${fmt(amount)}`} height={40} size={15} onPress={onAccept} style={{ marginTop: 6 }} />}
    </View>
  );
}
