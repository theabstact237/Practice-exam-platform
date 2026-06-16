/**
 * Learn tab — Subject selector + Skill tree.
 * The main entry point for daily learning.
 */
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { SUBJECTS } from '../../constants/subjects';
import { PYTHON_UNITS, PYTHON_CHAPTERS } from '../../constants/pythonSyllabus';
import { useUserStore } from '../../stores/useUserStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { useGameFeedback } from '../../hooks/useGameFeedback';

interface TreeUnit {
  id: string;
  title: string;
  xp: number;
  prerequisites: string[];
}

// AWS demo units — Python uses PYTHON_UNITS from pythonSyllabus.ts
const AWS_UNITS: TreeUnit[] = [
  { id: 'aws_unit_1', title: '☁️ Cloud Concepts', xp: 10, prerequisites: [] },
  { id: 'aws_unit_2', title: '💰 Pricing & Billing', xp: 10, prerequisites: ['aws_unit_1'] },
  { id: 'aws_unit_3', title: '🖥️ EC2 Compute', xp: 15, prerequisites: ['aws_unit_1'] },
  { id: 'aws_unit_4', title: '🗄️ S3 Storage', xp: 15, prerequisites: ['aws_unit_2'] },
  { id: 'aws_unit_5', title: '🔒 IAM Security', xp: 20, prerequisites: ['aws_unit_3', 'aws_unit_4'] },
];

type TreeItem =
  | { type: 'header'; key: string; emoji: string; title: string }
  | { type: 'unit'; key: string; unit: TreeUnit; nodeIndex: number };

/** Flatten chapters + units into a render list with zigzag node indices. */
function buildTreeItems(subject: string): TreeItem[] {
  if (subject === 'python') {
    const items: TreeItem[] = [];
    let nodeIndex = 0;
    for (const ch of PYTHON_CHAPTERS) {
      const units = PYTHON_UNITS.filter(u => u.chapter === ch.id);
      if (units.length === 0) continue;
      items.push({ type: 'header', key: `ch_${ch.id}`, emoji: ch.emoji, title: ch.title });
      for (const u of units) {
        items.push({
          type: 'unit',
          key: u.id,
          unit: { id: u.id, title: `🐍 ${u.title}`, xp: u.xp, prerequisites: u.prerequisites },
          nodeIndex: nodeIndex++,
        });
      }
    }
    return items;
  }
  if (subject === 'aws') {
    return AWS_UNITS.map((u, i) => ({ type: 'unit', key: u.id, unit: u, nodeIndex: i }));
  }
  return [];
}

const PulsingNode = ({ onPress, locked, completed, stars, title }: {
  onPress: () => void;
  locked: boolean;
  completed: boolean;
  stars: number;
  title: string;
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    if (!locked && !completed) {
      scale.value = withRepeat(
        withSequence(withTiming(1.06, { duration: 900 }), withTiming(1, { duration: 900 })),
        -1,
        true,
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [locked, completed, scale]);

  const bgColor = locked ? Colors.bgMid : completed ? Colors.success : Colors.primary;

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.unitNode, { backgroundColor: bgColor, opacity: locked ? 0.4 : 1 }]}
        onPress={onPress}
        disabled={locked}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${title}${locked ? ', locked' : completed ? ', completed' : ''}`}
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
  const { streak, xp, hearts, isPro, dailyXp, lastXpDate, dailyGoalMins, setDailyGoal } = useUserStore();
  const { getUnitProgress, isUnitUnlocked } = useProgressStore();
  const { triggerTap } = useGameFeedback();

  // Honor onboarding choices: starting subject + daily goal.
  useEffect(() => {
    (async () => {
      try {
        const [subj, goal] = await Promise.all([
          AsyncStorage.getItem('freecertify_first_subject'),
          AsyncStorage.getItem('freecertify_daily_goal'),
        ]);
        if (subj && SUBJECTS.some(s => s.id === subj)) setActiveSubject(subj);
        const mins = goal ? parseInt(goal, 10) : NaN;
        if (!Number.isNaN(mins) && mins > 0) setDailyGoal(mins);
      } catch {
        // defaults are fine
      }
    })();
  }, [setDailyGoal]);

  const treeItems = buildTreeItems(activeSubject);

  // Daily goal: ~1 lesson (≈10 XP) per 2 minutes of study.
  const today = new Date().toISOString().split('T')[0];
  const todayXp = lastXpDate === today ? dailyXp : 0;
  const targetXp = Math.max(10, dailyGoalMins * 6);
  const goalPct = Math.min(100, Math.round((todayXp / targetXp) * 100));

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

      {/* Daily goal progress */}
      <View style={styles.goalRow}>
        <Text style={styles.goalLabel}>🎯 Daily goal</Text>
        <View style={styles.goalBar}>
          <View style={[styles.goalFill, { width: `${goalPct}%` }, goalPct >= 100 && { backgroundColor: Colors.success }]} />
        </View>
        <Text style={styles.goalValue}>
          {goalPct >= 100 ? 'Done! 🎉' : `${todayXp}/${targetXp} XP`}
        </Text>
      </View>

      {/* Subject / course selector */}
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
            <Text
              style={[styles.subjectChipLabel, activeSubject === s.id && { color: s.color }]}
              numberOfLines={1}
            >
              {s.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Skill tree */}
      <ScrollView contentContainerStyle={styles.treeScroll}>
        <Animated.View entering={FadeInDown.duration(400)}>
          {treeItems.length > 0 ? (
            <View style={styles.pathWrap}>
              {/* Dashed path connecting nodes */}
              <View style={styles.pathLine} pointerEvents="none" />
              {treeItems.map(item => {
                if (item.type === 'header') {
                  return (
                    <View key={item.key} style={styles.chapterHeader}>
                      <Text style={styles.chapterEmoji}>{item.emoji}</Text>
                      <Text style={styles.chapterTitle}>{item.title}</Text>
                    </View>
                  );
                }

                const { unit, nodeIndex } = item;
                const progress = getUnitProgress(unit.id);
                const locked = !isUnitUnlocked(unit.id, unit.prerequisites);
                const isEven = nodeIndex % 2 === 0;

                return (
                  <View key={item.key} style={styles.unitRow}>
                    <View
                      style={[
                        styles.unitInner,
                        {
                          flexDirection: isEven ? 'row' : 'row-reverse',
                          transform: [{ translateX: isEven ? -52 : 52 }],
                        },
                      ]}
                    >
                      <PulsingNode
                        title={unit.title}
                        onPress={() => handleUnitPress(unit.id)}
                        locked={locked}
                        completed={progress.completed}
                        stars={progress.stars}
                      />
                      <View
                        style={[
                          styles.unitLabel,
                          isEven
                            ? { marginLeft: Spacing.md }
                            : { marginRight: Spacing.md, alignItems: 'flex-end' },
                        ]}
                      >
                        <Text style={styles.unitTitle} numberOfLines={2}>{unit.title}</Text>
                        <Text style={styles.unitXP}>+{unit.xp} XP</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
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
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    backgroundColor: Colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  goalLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  goalBar: {
    flex: 1,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgMid,
    overflow: 'hidden',
  },
  goalFill: { height: '100%', borderRadius: Radius.full, backgroundColor: Colors.xpGold },
  goalValue: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, minWidth: 70, textAlign: 'right' },
  subjectScroll: {
    flexGrow: 0,
    backgroundColor: Colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subjectScrollContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgMid,
    gap: Spacing.sm,
    flexShrink: 0,
  },
  subjectChipEmoji: { fontSize: 18, lineHeight: 22 },
  subjectChipLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: 18,
    flexShrink: 0,
  },
  treeScroll: { padding: Spacing.xl, paddingTop: Spacing.lg },
  pathWrap: { position: 'relative' },
  pathLine: {
    position: 'absolute',
    left: '50%',
    top: 36,
    bottom: 36,
    width: 0,
    borderLeftWidth: 2,
    borderColor: Colors.bgMid,
    borderStyle: 'dashed',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgDark,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginVertical: Spacing.md,
  },
  chapterEmoji: { fontSize: 18 },
  chapterTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  unitRow: { alignItems: 'center', marginBottom: Spacing.xl },
  unitInner: { alignItems: 'center' },
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
  unitLabel: { maxWidth: 150 },
  unitTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  unitXP: { color: Colors.xpGold, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: 2 },
  comingSoon: { alignItems: 'center', paddingTop: Spacing.xxl * 2 },
  comingSoonEmoji: { fontSize: 80, marginBottom: Spacing.lg },
  comingSoonTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  comingSoonSub: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', marginTop: Spacing.sm },
});
