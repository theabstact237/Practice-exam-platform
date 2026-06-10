/**
 * Learn tab — Subject selector + Skill tree.
 * The main entry point for daily learning.
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { SUBJECTS } from '../../constants/subjects';
import { PYTHON_UNITS } from '../../constants/pythonSyllabus';
import { useUserStore } from '../../stores/useUserStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { useGameFeedback } from '../../hooks/useGameFeedback';

// AWS demo units — Python uses PYTHON_UNITS from pythonSyllabus.ts
const AWS_UNITS = [
  { id: 'aws_unit_1', title: '☁️ Cloud Concepts', xp: 10, prerequisites: [] },
  { id: 'aws_unit_2', title: '💰 Pricing & Billing', xp: 10, prerequisites: ['aws_unit_1'] },
  { id: 'aws_unit_3', title: '🖥️ EC2 Compute', xp: 15, prerequisites: ['aws_unit_1'] },
  { id: 'aws_unit_4', title: '🗄️ S3 Storage', xp: 15, prerequisites: ['aws_unit_2'] },
  { id: 'aws_unit_5', title: '🔒 IAM Security', xp: 20, prerequisites: ['aws_unit_3', 'aws_unit_4'] },
];

const PulsingNode = ({ onPress, unit, locked, completed, stars }: {
  onPress: () => void;
  unit: { id: string; title: string; xp: number };
  locked: boolean;
  completed: boolean;
  stars: number;
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!locked && !completed) {
    scale.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      true,
    );
  }

  const bgColor = locked ? Colors.bgMid : completed ? Colors.success : Colors.primary;

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.unitNode, { backgroundColor: bgColor, opacity: locked ? 0.4 : 1 }]}
        onPress={onPress}
        disabled={locked}
        activeOpacity={0.8}
      >
        <Text style={styles.unitNodeText}>
          {locked ? '🔒' : completed ? '⭐'.repeat(Math.max(stars, 1)) : '▶'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function LearnTab() {
  const [activeSubject, setActiveSubject] = useState('python');
  const { streak, xp, hearts, isPro } = useUserStore();
  const { getUnitProgress, isUnitUnlocked } = useProgressStore();
  const { triggerTap } = useGameFeedback();

  const activeUnits =
    activeSubject === 'python'
      ? PYTHON_UNITS.map(u => ({
          id: u.id,
          title: `🐍 ${u.title}`,
          xp: u.xp,
          prerequisites: u.prerequisites,
        }))
      : activeSubject === 'aws'
        ? AWS_UNITS
        : [];

  const handleUnitPress = (unitId: string) => {
    triggerTap();
    router.push({ pathname: '/lesson/[unitId]', params: { unitId } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar: streak + XP + hearts */}
      <View style={styles.topBar}>
        <View style={styles.topStat}>
          <Text style={styles.topStatIcon}>🔥</Text>
          <Text style={styles.topStatValue}>{streak}</Text>
        </View>
        <View style={styles.topStat}>
          <Text style={styles.topStatIcon}>⚡</Text>
          <Text style={styles.topStatValue}>{xp}</Text>
        </View>
        <View style={styles.topStat}>
          <Text style={styles.topStatIcon}>❤️</Text>
          <Text style={[styles.topStatValue, hearts === 0 && { color: Colors.error }]}>
            {isPro ? '∞' : hearts}
          </Text>
        </View>
      </View>

      {/* Subject selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.subjectScroll}
        contentContainerStyle={styles.subjectScrollContent}
      >
        {SUBJECTS.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.subjectChip,
              activeSubject === s.id && { backgroundColor: s.color + '25', borderColor: s.color },
            ]}
            onPress={() => { triggerTap(); setActiveSubject(s.id); }}
            activeOpacity={0.8}
          >
            <Text style={styles.subjectChipEmoji}>{s.emoji}</Text>
            <Text style={[styles.subjectChipLabel, activeSubject === s.id && { color: s.color }]}>
              {s.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Skill tree */}
      <ScrollView contentContainerStyle={styles.treeScroll}>
        <Animated.View entering={FadeInDown.duration(400)}>
          {activeUnits.length > 0 ? (
            activeUnits.map((unit, i) => {
              const progress = getUnitProgress(unit.id);
              const locked = !isUnitUnlocked(unit.id, unit.prerequisites);
              const isEven = i % 2 === 0;

              return (
                <View key={unit.id} style={[styles.unitRow, isEven ? styles.unitRowLeft : styles.unitRowRight]}>
                  <PulsingNode
                    unit={unit}
                    onPress={() => handleUnitPress(unit.id)}
                    locked={locked}
                    completed={progress.completed}
                    stars={progress.stars}
                  />
                  <View style={[styles.unitLabel, isEven ? { marginLeft: Spacing.md } : { marginRight: Spacing.md, alignItems: 'flex-end' }]}>
                    <Text style={styles.unitTitle}>{unit.title}</Text>
                    <Text style={styles.unitXP}>+{unit.xp} XP</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonEmoji}>
                {SUBJECTS.find(s => s.id === activeSubject)?.emoji}
              </Text>
              <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
              <Text style={styles.comingSoonSub}>
                {SUBJECTS.find(s => s.id === activeSubject)?.name} lessons are being crafted.{'\n'}
                Check back soon!
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  topStatIcon: { fontSize: 18 },
  topStatValue: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  subjectScroll: { maxHeight: 60, backgroundColor: Colors.bgDark },
  subjectScrollContent: { paddingHorizontal: Spacing.md, paddingVertical: 10, gap: Spacing.sm, flexDirection: 'row' },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgMid,
    gap: 6,
  },
  subjectChipEmoji: { fontSize: 16 },
  subjectChipLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  treeScroll: { padding: Spacing.xl, paddingTop: Spacing.xxl },
  unitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xxl },
  unitRowLeft: { justifyContent: 'flex-start' },
  unitRowRight: { justifyContent: 'flex-end' },
  unitNode: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  unitNodeText: { fontSize: 24 },
  unitLabel: { flex: 1 },
  unitTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  unitXP: { color: Colors.xpGold, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: 2 },
  comingSoon: { alignItems: 'center', paddingTop: Spacing.xxl * 2 },
  comingSoonEmoji: { fontSize: 80, marginBottom: Spacing.lg },
  comingSoonTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  comingSoonSub: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', marginTop: Spacing.sm },
});
