import { View } from 'react-native';

import { ProductGrid, ProductTile } from '../components/products';
import { BackHeader, Screen } from '../components/Screen';
import { Txt } from '../components/ui';
import { allProducts, useMarket, useStore } from '../store/useStore';
import { colors } from '../theme/tokens';

export default function Favorites() {
  useMarket();
  const favs = useStore((s) => s.favs);
  const mine = useStore((s) => s.mine);
  const items = allProducts(mine).filter((p) => favs.includes(p.id));

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 16, paddingTop: 4 }}>
        <BackHeader title="Favoris" />
        <ProductGrid items={items} render={(p) => <ProductTile p={p} showLabel={false} />} />
        {items.length === 0 && (
          <View style={{ paddingVertical: 32, paddingHorizontal: 20, borderRadius: 28, backgroundColor: colors.surface }}>
            <Txt color={colors.neutral800} style={{ textAlign: 'center' }}>Touche le cœur d'un article pour le retrouver ici.</Txt>
          </View>
        )}
      </View>
    </Screen>
  );
}
