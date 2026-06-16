/**

 * Social sign-in for the FreeCertify mobile app (shared Firebase project aws-project-4f082).

 *

 * Google — native Google Sign-In SDK + signInWithCredential (reliable on Android).

 *

 * GitHub — WebBrowser OAuth + backend mobile-signin endpoint + signInWithCustomToken.

 * The backend verifies GitHub and mints a Firebase custom token so we are not limited

 * to Firebase's web-only GitHub OAuth redirect URL.

 */

import { useCallback, useRef, useState } from 'react';

import * as WebBrowser from 'expo-web-browser';

import * as AuthSession from 'expo-auth-session';

import {

  getAuth,

  GoogleAuthProvider,

  signInWithCredential,

  signInWithCustomToken,

} from '@react-native-firebase/auth';

import {

  GoogleSignin,

  statusCodes,

} from '@react-native-google-signin/google-signin';



WebBrowser.maybeCompleteAuthSession();



const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID ?? '';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';



const isConfigured = (v: string) => !!v && !v.startsWith('PASTE_');



/** Must match the Authorization callback URL on the mobile GitHub OAuth App exactly. */

export const GITHUB_REDIRECT_URI = AuthSession.makeRedirectUri({

  scheme: 'freecertify',

});



const GITHUB_SCOPES = ['read:user', 'user:email'];



function parseOAuthCode(url: string): string | null {

  try {

    const parsed = new URL(url);

    const code = parsed.searchParams.get('code');

    const error = parsed.searchParams.get('error');

    if (error) {

      throw new Error(parsed.searchParams.get('error_description') || error);

    }

    return code;

  } catch (e: any) {

    if (e?.message && !e.message.includes('Invalid URL')) {

      throw e;

    }

    const match = url.match(/[?&]code=([^&]+)/);

    return match ? decodeURIComponent(match[1]) : null;

  }

}



function buildGitHubAuthUrl(): string {

  const params = new URLSearchParams({

    client_id: GITHUB_CLIENT_ID,

    redirect_uri: GITHUB_REDIRECT_URI,

    scope: GITHUB_SCOPES.join(' '),

    state: Math.random().toString(36).slice(2),

  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;

}



export const useSocialAuth = (onSuccess?: () => void) => {

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const oauthTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  const clearOauthTimeout = () => {

    if (oauthTimeoutRef.current) {

      clearTimeout(oauthTimeoutRef.current);

      oauthTimeoutRef.current = null;

    }

  };



  const completeGitHubSignIn = useCallback(

    async (code: string) => {

      const res = await fetch(`${API_BASE_URL}/api/auth/github/mobile-signin/`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ code, redirect_uri: GITHUB_REDIRECT_URI }),

      });



      let data: {

        custom_token?: string;

        error?: string;

        code?: string;

      } = {};

      try {

        data = await res.json();

      } catch {

        throw new Error('Invalid response from sign-in server.');

      }



      if (!res.ok || !data.custom_token) {

        if (data.code === 'account_exists_different_provider') {

          throw Object.assign(new Error(data.error || 'Account exists with another provider.'), {

            code: 'auth/account-exists-with-different-credential',

          });

        }

        throw new Error(data.error || 'GitHub sign-in failed on the server.');

      }



      await signInWithCustomToken(getAuth(), data.custom_token);



      const user = getAuth().currentUser;

      if (!user) {

        throw new Error('Signed in but Firebase user was not available. Try again.');

      }



      onSuccess?.();

    },

    [onSuccess],

  );



  const signInWithGoogle = useCallback(async () => {

    setError(null);

    setLoading(true);

    try {

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const result: any = await GoogleSignin.signIn();

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

        // User dismissed.

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

    if (!isConfigured(GITHUB_CLIENT_ID)) {

      setError('GitHub sign-in is not configured (missing EXPO_PUBLIC_GITHUB_CLIENT_ID).');

      return;

    }

    if (!API_BASE_URL) {

      setError('Backend URL is not configured (EXPO_PUBLIC_API_BASE_URL).');

      return;

    }



    if (__DEV__) {

      console.log('[OAuth] GitHub redirect URI (register on GitHub OAuth App):', GITHUB_REDIRECT_URI);

      console.log('[OAuth] GitHub client ID:', GITHUB_CLIENT_ID);

      console.log('[OAuth] Backend:', API_BASE_URL);

    }



    setError(null);

    setLoading(true);

    clearOauthTimeout();

    oauthTimeoutRef.current = setTimeout(() => {

      setLoading(false);

      setError(

        'GitHub sign-in timed out. On GitHub, set the OAuth App callback URL to: ' +

          GITHUB_REDIRECT_URI,

      );

    }, 90_000);



    try {

      const authUrl = buildGitHubAuthUrl();

      const result = await WebBrowser.openAuthSessionAsync(authUrl, GITHUB_REDIRECT_URI, {

        preferEphemeralSession: false,

        showInRecents: true,

      });



      clearOauthTimeout();



      if (result.type === 'cancel' || result.type === 'dismiss') {

        setLoading(false);

        return;

      }



      if (result.type !== 'success' || !result.url) {

        throw new Error('GitHub did not return to the app. Check the OAuth callback URL.');

      }



      const code = parseOAuthCode(result.url);

      if (!code) {

        throw new Error('GitHub did not return an authorization code.');

      }



      await completeGitHubSignIn(code);

    } catch (e: any) {

      clearOauthTimeout();

      const code = e?.code ?? '';

      console.log('[OAuth] GitHub sign-in error:', code, e?.message ?? e);

      if (code === 'auth/account-exists-with-different-credential') {

        setError(

          e?.message ||

            'This email is already registered with Google on the web app. Use Continue with Google instead.',

        );

      } else if (

        e?.message?.includes('Network request failed') ||

        e?.message?.includes('fetch') ||

        e?.message?.includes('sign-in server')

      ) {

        setError(

          'Could not reach the backend. Ensure Django is running and EXPO_PUBLIC_API_BASE_URL matches your PC LAN IP.',

        );

      } else {

        setError(e?.message || 'Could not complete GitHub sign-in.');

      }

    } finally {

      clearOauthTimeout();

      setLoading(false);

    }

  }, [completeGitHubSignIn]);



  return {

    signInWithGoogle,

    signInWithGitHub,

    loading,

    error,

    googleConfigured: true,

    githubConfigured: isConfigured(GITHUB_CLIENT_ID),

    githubRedirectUri: GITHUB_REDIRECT_URI,

  };

};


