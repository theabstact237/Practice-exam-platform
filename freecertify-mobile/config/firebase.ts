/**
 * Firebase auth for the FreeCertify mobile app — native SDK (@react-native-firebase).
 *
 * Uses the SAME Firebase project as the web app (aws-project-4f082) via the
 * google-services.json that's bundled into the development/production build,
 * so mobile and web share one user database.
 *
 * The native SDK auto-initializes the default app from google-services.json at
 * startup, so there's no manual initializeApp() / config object here. GitHub
 * sign-in runs through Firebase's native OAuth flow (see useSocialAuth), which
 * uses the GitHub provider configured in the Firebase Console — the same one
 * the web app uses — so accounts and identity linking match the web exactly.
 */
import { getAuth } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const auth = getAuth();

// Configure Google Sign-In once at startup. The WEB client ID (client_type 3)
// from the shared Firebase project is what mints the idToken we exchange for a
// Firebase credential — this is the same Google client the web app uses, so the
// resulting account is the SAME shared user across web and mobile.
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
});
