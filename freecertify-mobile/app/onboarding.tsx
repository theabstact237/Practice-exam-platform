/**
 * Onboarding flow — 4-step wizard shown only on first launch.
 * Goal → Experience → Subject → Daily Goal
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../constants/theme';
import { SUBJECTS } from '../constants/subjects';
import { useGameFeedback } from '../hooks/useGameFeedback';

const { width } = Dimensions.get('window');

type Goal = 'job' | 'certification' | 'fun' | 'upskill';
type Level = 'beginner' | 'some' | 'professional';

const GOALS = [
  { id: 'job' as Goal, emoji: '🚀', label: 'Get a tech job' },
  { id: 'certification' as Goal, emoji: '🎓', label: 'Pass a certification' },
  { id: 'fun' as Goal, emoji: '💡', label: 'Learn to code for fun' },
  { id: 'upskill' as Goal, emoji: '📈', label: 'Upskill as a professional' },
];

const LEVELS = [
  { id: 'beginner' as Level, emoji: '👶', label: 'Complete beginner', sub: 'No coding experience' },
  { id: 'some' as Level, emoji: '📚', label: 'Some experience', sub: 'I\'ve dabbled before' },
  { id: 'professional' as Level, emoji: '💼', label: 'Working professional', sub: 'I code at work' },
];

const DAILY_GOALS = [
  { mins: 5, label: 'Casual', sub: '~3 lessons/day', emoji: '🌱' },
  { mins: 10, label: 'Regular', sub: '~5 lessons/day', emoji: '🔥' },
  { mins: 15, label: 'Serious', sub: '~8 lessons/day', emoji: '⚡' },
  { mins: 20, label: 'Intense', sub: '~10 lessons/day', emoji: '🏆' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [dailyGoal, setDailyGoal] = useState<number>(10);
  const { triggerTap, triggerSelect } = useGameFeedback();

  const progressWidth = useSharedValue((1 / 4) * 100);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const advance = (nextStep: number) => {
    progressWidth.value = withSpring(((nextStep + 1) / 4) * 100);
    setStep(nextStep);
  };

  const finish = async () => {
    await AsyncStorage.setItem('freecertify_onboarded', 'true');
    await AsyncStorage.setItem('freecertify_first_subject', subject || 'aws');
    await AsyncStorage.setItem('freecertify_daily_goal', String(dailyGoal));
    router.replace('/(tabs)/learn');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
            <Text style={styles.stepLabel}>1 of 4</Text>
            <Text style={styles.title}>What's your goal?</Text>
            <Text style={styles.subtitle}>We'll personalise your learning path</Text>
            {GOALS.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[styles.optionCard, goal === g.id && styles.optionCardSelected]}
                onPress={() => { triggerSelect(); setGoal(g.id); }}
                activeOpacity={0.8}
              >
                <Text style={styles.optionEmoji}>{g.emoji}</Text>
                <Text style={[styles.optionLabel, goal === g.id && styles.optionLabelSelected]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.ctaButton, !goal && styles.ctaDisabled]}
              onPress={() => { triggerTap(); if (goal) advance(1); }}
              disabled={!goal}
            >
              <Text style={styles.ctaText}>Continue →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
            <Text style={styles.stepLabel}>2 of 4</Text>
            <Text style={styles.title}>What's your background?</Text>
            <Text style={styles.subtitle}>We'll skip what you already know</Text>
            {LEVELS.map(l => (
              <TouchableOpacity
                key={l.id}
                style={[styles.optionCard, level === l.id && styles.optionCardSelected]}
                onPress={() => { triggerSelect(); setLevel(l.id); }}
                activeOpacity={0.8}
              >
                <Text style={styles.optionEmoji}>{l.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, level === l.id && styles.optionLabelSelected]}>
                    {l.label}
                  </Text>
                  <Text style={styles.optionSub}>{l.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.ctaButton, !level && styles.ctaDisabled]}
              onPress={() => { triggerTap(); if (level) advance(2); }}
              disabled={!level}
            >
              <Text style={styles.ctaText}>Continue →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
            <Text style={styles.stepLabel}>3 of 4</Text>
            <Text style={styles.title}>Pick your first track</Text>
            <Text style={styles.subtitle}>You can unlock more later</Text>
            <View style={styles.subjectGrid}>
              {SUBJECTS.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.subjectCard,
                    { borderColor: subject === s.id ? s.color : Colors.border },
                    subject === s.id && { backgroundColor: s.color + '20' },
                  ]}
                  onPress={() => { triggerSelect(); setSubject(s.id); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.subjectEmoji}>{s.emoji}</Text>
                  <Text style={[styles.subjectName, subject === s.id && { color: s.color }]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.ctaButton, !subject && styles.ctaDisabled]}
              onPress={() => { triggerTap(); if (subject) advance(3); }}
              disabled={!subject}
            >
              <Text style={styles.ctaText}>Continue →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
            <Text style={styles.stepLabel}>4 of 4</Text>
            <Text style={styles.title}>Set your daily goal</Text>
            <Text style={styles.subtitle}>Small habits create big results 🔥</Text>
            {DAILY_GOALS.map(g => (
              <TouchableOpacity
                key={g.mins}
                style={[styles.optionCard, dailyGoal === g.mins && styles.optionCardSelected]}
                onPress={() => { triggerSelect(); setDailyGoal(g.mins); }}
                activeOpacity={0.8}
              >
                <Text style={styles.optionEmoji}>{g.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, dailyGoal === g.mins && styles.optionLabelSelected]}>
                    {g.label} — {g.mins} min/day
                  </Text>
                  <Text style={styles.optionSub}>{g.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.ctaButton} onPress={finish}>
              <Text style={styles.ctaText}>Start Learning 🚀</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.bgMid,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  stepLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginBottom: Spacing.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  optionEmoji: { fontSize: 28 },
  optionLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  optionLabelSelected: { color: Colors.primary },
  optionSub: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  subjectCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    borderWidth: 2,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subjectEmoji: { fontSize: 36 },
  subjectName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  ctaDisabled: { backgroundColor: Colors.bgLight, opacity: 0.5 },
  ctaText: {
    color: Colors.bgDeep,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
});
