import { router, useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { openProduct, Thumb } from '../../components/products';
import { BackButton, BottomBar, Screen } from '../../components/Screen';
import { Avatar, ellipsis, H, Txt } from '../../components/ui';
import { fmt } from '../../lib/format';
import { productById, sellerById, useStore } from '../../store/useStore';
import { colors, fonts, ICON_STROKE } from '../../theme/tokens';

const QUICK = ['Est-ce toujours disponible ?', 'Remise en main propre possible ?', "Tu as d'autres pièces dans cette taille ?"];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chat = useStore((s) => s.chats[id]);
  const typing = useStore((s) => s.typingCid === id);
  const mine = useStore((s) => s.mine);
  const send = useStore((s) => s.send);
  const addToCart = useStore((s) => s.addToCart);
  const [draft, setDraft] = useState('');
  const scroll = useRef<ScrollView>(null);

  const count = chat?.msgs.length ?? 0;
  useEffect(() => { scroll.current?.scrollToEnd({ animated: true }); }, [count, typing]);

  if (!chat) return <Screen><Txt style={{ padding: 20 }}>Conversation introuvable.</Txt></Screen>;
  const seller = sellerById(chat.sid)!;
  const p = productById(mine, chat.pid)!;

  const submit = (t: string) => { send(id, t); setDraft(''); };

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
          <Avatar init={seller.init} size={40} font={16} />
          <View style={{ flex: 1 }}>
            <Txt weight="bold">{seller.name}</Txt>
            <Txt size={12} color={colors.accent2_700}>Répond en général en 1 h</Txt>
          </View>
        </View>

        <Pressable onPress={() => openProduct(p.id)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 10, borderRadius: 22, backgroundColor: colors.surface }}>
          <Thumb p={p} size={52} radius={16} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt size={14} weight="semi" {...ellipsis}>{p.title}</Txt>
            <Txt size={14} weight="bold">{fmt(p.price)}</Txt>
          </View>
          {p.sid !== 'me' && (
            <Pressable onPress={() => { addToCart(p.id); router.push('/cart'); }} style={{ height: 38, paddingHorizontal: 16, borderRadius: 999, backgroundColor: colors.accent, justifyContent: 'center' }}>
              <H size={14} color={colors.bg}>Acheter</H>
            </Pressable>
          )}
        </Pressable>

        <Txt size={12} color={colors.neutral600} style={{ textAlign: 'center', paddingVertical: 4 }}>Aujourd'hui</Txt>

        {chat.msgs.map((m, i) => (
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
            <Txt size={13} color={colors.neutral700}>{seller.name} écrit…</Txt>
          </View>
        )}
      </View>
    </Screen>
  );
}
