/**
 * Login / Sign-up screen.
 *
 * Uses Firebase email/password auth (works in Expo Go with the JS SDK), plus
 * Google and GitHub via expo-auth-session (see useSocialAuth). All paths sign
 * into the same Firebase project the web app uses, so accounts are shared.
 *
 * The onAuthStateChanged listener in _layout.tsx syncs the signed-in user
 * into the Zustand store, so this screen only needs to call the auth methods
 * and then navigate.
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from '@react-native-firebase/auth';
import { auth } from '../config/firebase';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../constants/theme';
import { useGameFeedback } from '../hooks/useGameFeedback';
import { useSocialAuth } from '../hooks/useSocialAuth';

type Mode = 'signin' | 'signup';

// Maps Firebase error codes to friendly messages.
const friendlyError = (code: string): string => {
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

export default function Login() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { triggerTap } = useGameFeedback();

  const {
    signInWithGoogle,
    signInWithGitHub,
    loading: socialLoading,
    error: socialError,
  } = useSocialAuth(() => router.replace('/(tabs)/learn'));

  const isSignup = mode === 'signup';
  const busy = loading || socialLoading;

  const handleSubmit = async () => {
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (isSignup && !name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
      // Auth listener in _layout.tsx updates the store; head to the app.
      router.replace('/(tabs)/learn');
    } catch (e: any) {
      setError(friendlyError(e?.code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = () => {
    triggerTap();
    router.replace('/(tabs)/learn');
  };

  const switchMode = () => {
    triggerTap();
    setError(null);
    setMode(isSignup ? 'signin' : 'signup');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>☁️</Text>
            </View>
            <Text style={styles.appName}>FreeCertify</Text>
            <Text style={styles.tagline}>
              {isSignup ? 'Create your free account' : 'Welcome back'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isSignup && (
              <View style={styles.field}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  editable={!loading}
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!loading}
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.primaryBtn, busy && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={busy}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.bgDeep} />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isSignup ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Mode toggle */}
            <TouchableOpacity onPress={switchMode} disabled={busy}>
              <Text style={styles.switchText}>
                {isSignup
                  ? 'Already have an account? '
                  : "Don't have an account? "}
                <Text style={styles.switchLink}>
                  {isSignup ? 'Sign in' : 'Sign up'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          {/* Social sign-in — both run through the shared Firebase project,
              so accounts match the web app. */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => {
              triggerTap();
              signInWithGoogle();
            }}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.githubBtn}
            onPress={() => {
              triggerTap();
              signInWithGitHub();
            }}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={styles.githubBtnText}>Continue with GitHub</Text>
          </TouchableOpacity>

          {socialError && <Text style={styles.error}>{socialError}</Text>}
          {socialLoading && (
            <ActivityIndicator color={Colors.primary} style={styles.socialSpinner} />
          )}

          {/* Guest */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={continueAsGuest}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={styles.guestBtnText}>Continue as guest</Text>
          </TouchableOpacity>
          <Text style={styles.guestHint}>
            You can sign in later to save your progress across devices.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  brand: { alignItems: 'center', marginBottom: Spacing.xl },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary + '60',
    marginBottom: Spacing.md,
  },
  logoEmoji: { fontSize: 36 },
  appName: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: 4,
  },
  form: { gap: Spacing.md },
  field: { gap: 6 },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color: Colors.bgDeep,
    fontWeight: FontWeight.black,
    fontSize: FontSize.md,
  },
  switchText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  switchLink: { color: Colors.primary, fontWeight: FontWeight.bold },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: FontSize.sm },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  googleBtnText: {
    color: '#1f1f1f',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  githubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#24292e',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#444c56',
  },
  githubBtnText: {
    color: '#ffffff',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  socialSpinner: { marginBottom: Spacing.md },
  guestBtn: {
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guestBtnText: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  guestHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
