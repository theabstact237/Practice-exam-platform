import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { useUserStore } from '../../stores/useUserStore';
import { SUBJECTS } from '../../constants/subjects';

export default function ProfileTab() {
  const {
    user, xp, streak, longestStreak, gems, isPro,
    soundEnabled, hapticsEnabled,
    toggleSound, toggleHaptics, reset,
  } = useUserStore();

  const displayName = user?.displayName || 'Guest Learner';
  const email = user?.email || 'Not signed in';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar & info */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          {isPro && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>⭐ PRO</Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'XP', value: xp.toLocaleString(), emoji: '⚡' },
            { label: 'Streak', value: `${streak}d`, emoji: '🔥' },
            { label: 'Best', value: `${longestStreak}d`, emoji: '🏆' },
            { label: 'Gems', value: gems, emoji: '💎' },
          ].map(s => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Settings</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>🔊 Sound Effects</Text>
          <Switch
            value={soundEnabled}
            onValueChange={toggleSound}
            trackColor={{ false: Colors.bgMid, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>📳 Haptic Feedback</Text>
          <Switch
            value={hapticsEnabled}
            onValueChange={toggleHaptics}
            trackColor={{ false: Colors.bgMid, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Pro upgrade */}
        {!isPro && (
          <>
            <Text style={styles.sectionTitle}>Upgrade to Pro</Text>
            <View style={styles.proCard}>
              <Text style={styles.proTitle}>⭐ FreeCertify Pro</Text>
              <Text style={styles.proPrice}>$6.99/month · $49.99/year</Text>
              {[
                'Unlimited daily lessons',
                'Unlimited hearts',
                'All 6 subjects unlocked',
                'Official shareable certificates',
                'Unlimited AI tutor',
                'Ad-free experience',
                'Offline lesson packs',
              ].map(f => (
                <Text key={f} style={styles.proFeature}>✓ {f}</Text>
              ))}
              <TouchableOpacity style={styles.proBtn}>
                <Text style={styles.proBtnText}>Start 7-Day Free Trial</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Sign out / Reset */}
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={reset}>
          <Text style={styles.dangerBtnText}>Reset Progress (Dev)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { padding: Spacing.lg },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: { color: Colors.bgDeep, fontSize: FontSize.xxxl, fontWeight: FontWeight.black },
  displayName: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  email: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  proBadge: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.xpGold + '25',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.xpGold + '60',
  },
  proBadgeText: { color: Colors.xpGold, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statBox: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statEmoji: { fontSize: 20 },
  statValue: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.black },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  sectionTitle: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingLabel: { color: Colors.textPrimary, fontSize: FontSize.md },
  proCard: {
    backgroundColor: Colors.xpGold + '10',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.xpGold + '40',
  },
  proTitle: { color: Colors.xpGold, fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 4 },
  proPrice: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.md },
  proFeature: { color: Colors.textPrimary, fontSize: FontSize.sm, marginBottom: 6 },
  proBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.xpGold,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  proBtnText: { color: Colors.bgDeep, fontWeight: FontWeight.black, fontSize: FontSize.md },
  dangerBtn: {
    backgroundColor: Colors.error + '20',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  dangerBtnText: { color: Colors.error, fontWeight: FontWeight.bold },
});
