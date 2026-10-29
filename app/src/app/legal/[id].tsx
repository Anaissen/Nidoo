import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { LegalText } from '../../components/LegalText';
import { BackHeader, Screen } from '../../components/Screen';
import { H, LinkButton, Txt } from '../../components/ui';
import { LEGAL_DOCS, LEGAL_IDS, LegalId } from '../../data/legal';
import { colors } from '../../theme/tokens';

/** Conditions d'utilisation, confidentialité or mentions légales. Public: also linked from the web for Stripe. */
export default function LegalPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const make = LEGAL_DOCS[id as LegalId];
  if (!make) return <Screen><BackHeader title="Informations légales" style={{ margin: 20 }} /><Txt style={{ padding: 20 }}>Page introuvable.</Txt></Screen>;
  const doc = make();

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 16, paddingTop: 4, paddingBottom: 12 }}>
        <BackHeader title={doc.short} />
        <H size={26}>{doc.title}</H>
        <LegalText text={doc.intro} />
        {doc.sections.map((s) => (
          <View key={s.title} style={{ gap: 8 }}>
            <H size={18}>{s.title}</H>
            {s.body.map((b, i) => (typeof b === 'string' ? <LegalText key={i} text={b} /> : (
              <View key={i} style={{ gap: 6 }}>
                {b.map((line) => (
                  <View key={line} style={{ flexDirection: 'row', gap: 8 }}>
                    <Txt size={14} color={colors.accent700}>•</Txt>
                    <View style={{ flex: 1 }}><LegalText text={line} /></View>
                  </View>
                ))}
              </View>
            )))}
          </View>
        ))}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.divider }}>
          {LEGAL_IDS.filter((x) => x !== id).map((x) => (
            <LinkButton key={x} label={LEGAL_DOCS[x]().short} size={13} onPress={() => router.replace(`/legal/${x}`)} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
