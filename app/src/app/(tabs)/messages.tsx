import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { tonesFor } from '../../components/products';
import { Screen } from '../../components/Screen';
import { Avatar, ellipsis, H, Stripes, Txt } from '../../components/ui';
import { productById, sellerById, useStore } from '../../store/useStore';
import { colors } from '../../theme/tokens';

export default function Messages() {
  const chats = useStore((s) => s.chats);
  const mine = useStore((s) => s.mine);
  const markRead = useStore((s) => s.markRead);

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 8, paddingTop: 4 }}>
        <H size={28} style={{ marginBottom: 8 }}>Messages</H>
        {Object.entries(chats).map(([id, c]) => {
          const seller = sellerById(c.sid)!;
          const p = productById(mine, c.pid)!;
          const last = c.msgs[c.msgs.length - 1];
          return (
            <Pressable
              key={id}
              onPress={() => { markRead(id); router.push(`/chat/${id}`); }}
              style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, marginHorizontal: -12, borderRadius: 24, backgroundColor: pressed ? colors.neutral100 : 'transparent' })}
            >
              <View>
                <Avatar init={seller.init} size={54} font={20} />
                <Stripes tones={tonesFor(p)} style={{ position: 'absolute', right: -4, bottom: -4, width: 28, height: 28, borderRadius: 10, borderWidth: 2, borderColor: colors.bg }} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt weight="bold">{seller.name}</Txt>
                  <Txt size={12} color={colors.neutral700}>{c.when}</Txt>
                </View>
                <Txt size={12} color={colors.neutral700} {...ellipsis}>{p.title}</Txt>
                <Txt size={14} weight={c.unread ? 'bold' : 'regular'} {...ellipsis}>
                  {last ? (last.me ? 'Toi : ' : '') + last.t : 'Nouvelle conversation'}
                </Txt>
              </View>
              {c.unread && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
