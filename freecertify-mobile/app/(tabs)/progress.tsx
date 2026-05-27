import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { useUserStore } from '../../stores/useUserStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { SUBJECTS } from '../../constants/subjects';

export default function ProgressTab() {
  const { xp, streak, longestStreak, hearts } = useUserStore();
  const { units } = useProgressStore();

  const completedUnits = Object.values(units).filter(u => u.completed).length;
  const totalStars = Object.values(units).reduce((acc, u) => acc + u.stars, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Your Progress</Text>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total XP', value: xp.toLocaleString(), emoji: '⚡' },
            { label: 'Current Streak', value: `${streak} days`, emoji: '🔥' },
            { label: 'Best Streak', value: `${longestStreak} days`, emoji: '🏆' },
            { label: 'Units Done', value: completedUnits, emoji: '✅' },
            { label: 'Stars Earned', value: totalStars, emoji: '⭐' },
            { label: 'Hearts', value: hearts, emoji: '❤️' },
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Subject progress */}
        <Text style={styles.sectionTitle}>Subject Progress</Text>
        {SUBJECTS.map(subject => {
          const subjectUnits = Object.values(units).filter(u => u.unitId.startsWith(subject.id));
          const done = subjectUnits.filter(u => u.completed).length;
          const total = Math.max(subjectUnits.length, 1);
          const pct = Math.round((done / total) * 100);

          return (
            <View key={subject.id} style={styles.subjectRow}>
              <Text style={styles.subjectEmoji}>{subject.emoji}</Text>
              <View style={styles.subjectInfo}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={[styles.subjectPct, { color: subject.color }]}>{pct}%</Text>
                </View>
                <View style={styles.subjectBar}>
                  <View style={[styles.subjectFill, { width: `${pct}%`, backgroundColor: subject.color }]} />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { padding: Spacing.lg },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.black, marginBottom: Spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statEmoji: { fontSize: 24 },
  statValue: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.black },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  subjectEmoji: { fontSize: 28 },
  subjectInfo: { flex: 1 },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subjectName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  subjectPct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  subjectBar: { height: 8, backgroundColor: Colors.bgMid, borderRadius: Radius.full, overflow: 'hidden' },
  subjectFill: { height: '100%', borderRadius: Radius.full },
});
