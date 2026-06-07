/**
 * Social sign-in for the FreeCertify mobile app, using the SAME Firebase project
 * as the web app (aws-project-4f082) so accounts are shared across platforms.
 *
 * GitHub runs through Firebase's NATIVE OAuth flow (@react-native-firebase):
 *   new OAuthProvider('github.com') + signInWithPopup(getAuth(), provider)
 *
 * This opens a Custom Tab handled by Firebase's own auth handler, which uses the
 * GitHub provider configured in the Firebase Console — the very same GitHub
 * OAuth app the web app uses. No separate mobile OAuth app, no client secret in
 * the app, and no backend code-exchange step. The web app is untouched.
 *
 * Requires a development/production build (not Expo Go) because it relies on the
 * native @react-native-firebase module and google-services.json.
 */
import { useCallback, useState } from 'react';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

export const useSocialAuth = (onSuccess?: () => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result: any = await GoogleSignin.signIn();
      // google-signin v13+ nests the token under `data`; older versions don't.
      const idToken = result?.data?.idToken ?? result?.idToken;
      if (!idToken) {
        throw new Error('No ID token returned from Google.');
      }
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(getAuth(), credential);
      onSuccess?.();
    } catch (e: any) {
      const code = e?.code ?? '';
      console.log('[OAuth] Google sign-in error:', code, e?.message ?? e);
      if (
        code === statusCodes.SIGN_IN_CANCELLED ||
        code === statusCodes.IN_PROGRESS
      ) {
        // User dismissed the Google chooser — not worth surfacing.
      } else if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services is required for Google sign-in.');
      } else {
        setError(e?.message || 'Could not complete Google sign-in.');
      }
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  const signInWithGitHub = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new OAuthProvider('github.com');
      provider.addScope('read:user');
      provider.addScope('user:email');

      await signInWithPopup(getAuth(), provider);
      // The onAuthStateChanged listener in _layout.tsx syncs the store.
      onSuccess?.();
    } catch (e: any) {
      const code = e?.code ?? '';
      console.log('[OAuth] GitHub sign-in error:', code, e?.message ?? e);
      if (
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/user-cancelled'
      ) {
        // User dismissed the sign-in sheet — not an error worth surfacing.
      } else if (code === 'auth/account-exists-with-different-credential') {
        setError(
          'An account already exists with this email (signed up a different way). Use that method to sign in.',
        );
      } else if (code === 'auth/operation-not-allowed') {
        setError('GitHub sign-in is not enabled in Firebase for this project.');
      } else {
        setError(e?.message || 'Could not complete GitHub sign-in.');
      }
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return {
    signInWithGoogle,
    signInWithGitHub,
    loading,
    error,
    googleConfigured: true,
    githubConfigured: true,
  };
};
