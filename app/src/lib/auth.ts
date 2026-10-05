import { router } from 'expo-router';

import { useStore } from '../store/useStore';

/** True when logged in; otherwise explains why and opens the login page. */
export function requireAccount(why: string) {
  const s = useStore.getState();
  if (s.signedIn) return true;
  s.showToast(`Connecte-toi pour ${why}`);
  router.push('/login');
  return false;
}
