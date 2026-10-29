import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { LegalText } from '../../components/LegalText';
import { BackHeader, Screen } from '../../components/Screen';
import { Txt } from '../../components/ui';
import { LEGAL, LEGAL_DOCS, LEGAL_IDS } from '../../data/legal';
import { colors, ICON_STROKE } from '../../theme/tokens';

/** Informations légales: the three documents and how to reach Pimou. */
export default function LegalIndex() {
  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 16, paddingTop: 4 }}>
        <BackHeader title="Informations légales" />
        <View style={{ borderRadius: 30, backgroundColor: colors.neutral100, overflow: 'hidden' }}>
          {LEGAL_IDS.map((id, i) => (
            <Pressable
              key={id}
              onPress={() => router.push(`/legal/${id}`)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 18,
                backgroundColor: pressed ? colors.neutral200 : 'transparent',
                borderBottomWidth: i < LEGAL_IDS.length - 1 ? 1 : 0, borderBottomColor: colors.divider,
              })}
            >
              <Txt weight="semi" style={{ flex: 1 }}>{LEGAL_DOCS[id]().title}</Txt>
              <ChevronRight size={18} strokeWidth={ICON_STROKE} color={colors.text} />
            </Pressable>
          ))}
        </View>
        <LegalText text={`Une question, un problème, un contenu à signaler ? Écris-nous à ${LEGAL.email}.`} />
        <Txt size={12} color={colors.neutral600}>Mis à jour le {LEGAL.updated}.</Txt>
      </View>
    </Screen>
  );
}
