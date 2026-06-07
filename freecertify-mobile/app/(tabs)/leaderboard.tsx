import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { useUserStore } from '../../stores/useUserStore';

const MOCK_LEADERS = [
  { rank: 1, name: 'Alex Chen', xp: 2840, emoji: '🥇', league: 'Gold' },
  { rank: 2, name: 'Maria Santos', xp: 2650, emoji: '🥈', league: 'Gold' },
  { rank: 3, name: 'Priya Patel', xp: 2410, emoji: '🥉', league: 'Gold' },
  { rank: 4, name: 'Kwame Osei', xp: 2190, emoji: '4️⃣', league: 'Gold' },
  { rank: 5, name: 'You', xp: 0, emoji: '5️⃣', league: 'Bronze', isMe: true },
];

const LEAGUES = [
  { name: 'Bronze', emoji: '🥉', color: '#cd7f32', description: 'Top 5 promote to Silver' },
  { name: 'Silver', emoji: '🥈', color: '#c0c0c0', description: 'Top 5 promote to Gold' },
  { name: 'Gold', emoji: '🥇', color: '#ffd700', description: 'Top 3 reach Diamond' },
  { name: 'Diamond', emoji: '💎', color: '#818cf8', description: 'Elite tier' },
];

export default function LeaderboardTab() {
  const { xp, weeklyXp } = useUserStore();
  const leaders = MOCK_LEADERS.map(l => l.isMe ? { ...l, xp: weeklyXp } : l)
    .sort((a, b) => b.xp - a.xp)
    .map((l, i) => ({ ...l, rank: i + 1 }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Weekly League</Text>
        <Text style={styles.subtitle}>Resets every Monday · Earn XP to climb</Text>

        {/* Current league badge */}
        <View style={styles.leagueCard}>
          <Text style={styles.leagueEmoji}>🥉</Text>
          <View>
            <Text style={styles.leagueName}>Bronze League</Text>
            <Text style={styles.leagueSub}>Top 5 this week promote to Silver →</Text>
          </View>
        </View>

        {/* Leaderboard */}
        {leaders.map(leader => (
          <View
            key={leader.rank}
            style={[styles.leaderRow, leader.isMe && styles.leaderRowMe]}
          >
            <Text style={styles.leaderRank}>{leader.emoji}</Text>
            <View style={styles.leaderInfo}>
              <Text style={[styles.leaderName, leader.isMe && { color: Colors.primary }]}>
                {leader.name} {leader.isMe && '(You)'}
              </Text>
              <Text style={styles.leaderXP}>{leader.xp.toLocaleString()} XP this week</Text>
            </View>
          </View>
        ))}

        {/* League tiers info */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>League Tiers</Text>
        {LEAGUES.map(league => (
          <View key={league.name} style={styles.tierRow}>
            <Text style={styles.tierEmoji}>{league.emoji}</Text>
            <View>
              <Text style={[styles.tierName, { color: league.color }]}>{league.name}</Text>
              <Text style={styles.tierDesc}>{league.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { padding: Spacing.lg },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.black, marginBottom: 4 },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.lg },
  leagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#cd7f3220',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#cd7f3240',
  },
  leagueEmoji: { fontSize: 36 },
  leagueName: { color: '#cd7f32', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  leagueSub: { color: Colors.textMuted, fontSize: FontSize.sm },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leaderRowMe: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  leaderRank: { fontSize: 28, width: 36, textAlign: 'center' },
  leaderInfo: { flex: 1 },
  leaderName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  leaderXP: { color: Colors.xpGold, fontSize: FontSize.sm, marginTop: 2 },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  tierEmoji: { fontSize: 28 },
  tierName: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  tierDesc: { color: Colors.textMuted, fontSize: FontSize.sm },
});
