import { Home1a } from '../../components/home/Home1a';
import { Home1b } from '../../components/home/Home1b';
import { Home1c } from '../../components/home/Home1c';
import { Screen } from '../../components/Screen';
import { useStore } from '../../store/useStore';

/** Accueil — three visual directions, switchable in Profil › Réglages. */
export default function Home() {
  const variant = useStore((s) => s.homeVariant);
  return (
    <Screen>
      {variant === '1a' && <Home1a />}
      {variant === '1b' && <Home1b />}
      {variant === '1c' && <Home1c />}
    </Screen>
  );
}
