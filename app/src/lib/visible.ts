import { AppState, Platform } from 'react-native';

/** The app is on screen (not in the background, not a hidden browser tab): worth checking for news. */
export const appVisible = () =>
  Platform.OS === 'web' ? typeof document === 'undefined' || document.visibilityState === 'visible' : AppState.currentState === 'active';

/** Every `ms` while signed in and on screen. Returns the function that stops it. */
export function everyWhileVisible(ms: number, fn: () => void) {
  const id = setInterval(() => { if (appVisible()) fn(); }, ms);
  return () => clearInterval(id);
}
