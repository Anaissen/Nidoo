import { router, useLocalSearchParams } from 'expo-router';

import { AuthMode, AuthPanel } from '../components/AuthPanel';
import { BackHeader, Screen } from '../components/Screen';

/** Log back in (after "Se déconnecter"), or create an account. */
export default function Login() {
  const { mode } = useLocalSearchParams<{ mode?: AuthMode }>();
  const done = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  return (
    <Screen keyboard contentStyle={{ paddingHorizontal: 20 }}>
      <BackHeader title="" style={{ marginBottom: 4 }} />
      <AuthPanel initialMode={mode === 'signup' ? 'signup' : 'login'} onDone={done} />
    </Screen>
  );
}
