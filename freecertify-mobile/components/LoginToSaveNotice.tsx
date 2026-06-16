/**
 * Shown during gameplay when the user is not signed in.
 */
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../constants/theme';
import { MascotGuide } from './MascotGuide';

interface LoginToSaveNoticeProps {
  subjectId?: string;
  variant?: 'banner' | 'card';
}

export function LoginToSaveNotice({ subjectId = 'python', variant = 'banner' }: LoginToSaveNoticeProps) {
  const goLogin = () => router.push('/login');

  if (variant === 'card') {
    return (
      <View style={styles.card}>
        <MascotGuide
          subjectId={subjectId}
          message="You need to login to save your progression. Sign in so your XP, hearts, and completed lessons stay with your account!"
        />
        <TouchableOpacity style={styles.btn} onPress={goLogin} activeOpacity={0.85}>
          <Text style={styles.btnText}>Sign In to Save Progress</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.banner} onPress={goLogin} activeOpacity={0.9}>
      <Text style={styles.bannerIcon}>🔐</Text>
      <View style={styles.bannerTextWrap}>
        <Text style={styles.bannerTitle}>You need to login to save your progression</Text>
        <Text style={styles.bannerLink}>Tap to sign in →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.warning + '18',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.warning + '45',
  },
  bannerIcon: { fontSize: 22 },
  bannerTextWrap: { flex: 1 },
  bannerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: 18,
  },
  bannerLink: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  card: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnText: {
    color: Colors.bgDeep,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
