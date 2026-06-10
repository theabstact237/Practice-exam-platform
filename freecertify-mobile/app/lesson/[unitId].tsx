/**
 * Gamified Lesson Screen — the heart of the app.
 *
 * Features:
 * - Timer ring around question number
 * - Answer cards with spring bounce on tap
 * - Shake animation on wrong answer
 * - Slide-up feedback panel
 * - XP float-up animation
 * - Heart loss with shake
 * - Confetti on perfect lesson
 * - Full sound + haptic feedback via useGameFeedback
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  useAnimatedStyle,
  runOnJS,
  FadeInDown,
  FadeOutDown,
  SlideInDown,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useUserStore } from '../../stores/useUserStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { getExamsByType, getRandomQuestions, APIQuestion } from '../../utils/api';
import { getPythonUnitById, unitIdToExamType } from '../../constants/pythonSyllabus';

const { width } = Dimensions.get('window');
const QUESTION_TIME = 90; // seconds per question

// ── XP Float animation ─────────────────────────────────────────────────────
const XPFloat = ({ amount, visible }: { amount: number; visible: boolean }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = 0;
      opacity.value = 1;
      translateY.value = withTiming(-60, { duration: 800 });
      opacity.value = withTiming(0, { duration: 800 });
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.xpFloat, style]}>
      <Text style={styles.xpFloatText}>+{amount} XP ⚡</Text>
    </Animated.View>
  );
};

// ── Answer Option Card ─────────────────────────────────────────────────────
type AnswerState = 'default' | 'selected' | 'correct' | 'wrong' | 'missed';

const AnswerCard = ({
  letter,
  text,
  state,
  onPress,
  disabled,
}: {
  letter: string;
  text: string;
  state: AnswerState;
  onPress: () => void;
  disabled: boolean;
}) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.96), withSpring(1));
    onPress();
  };

  useEffect(() => {
    if (state === 'wrong') {
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [state]);

  const bgColor =
    state === 'correct' ? Colors.success + '30'
    : state === 'wrong' ? Colors.error + '30'
    : state === 'missed' ? Colors.bgMid
    : state === 'selected' ? Colors.primary + '20'
    : Colors.bgDark;

  const borderColor =
    state === 'correct' ? Colors.success
    : state === 'wrong' ? Colors.error
    : state === 'selected' ? Colors.primary
    : Colors.border;

  const textColor =
    state === 'correct' ? Colors.success
    : state === 'wrong' ? Colors.error
    : state === 'selected' ? Colors.primary
    : Colors.textPrimary;

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.answerCard, { backgroundColor: bgColor, borderColor }]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.85}
      >
        <View style={[styles.answerLetter, { borderColor, backgroundColor: borderColor + '30' }]}>
          <Text style={[styles.answerLetterText, { color: borderColor }]}>{letter}</Text>
        </View>
        <Text style={[styles.answerText, { color: textColor }]}>{text}</Text>
        {state === 'correct' && <Text style={styles.answerIcon}>✓</Text>}
        {state === 'wrong' && <Text style={styles.answerIcon}>✗</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Hearts bar ─────────────────────────────────────────────────────────────
const HeartsBar = ({ hearts, max }: { hearts: number; max: number }) => (
  <View style={styles.heartsRow}>
    {Array.from({ length: max }).map((_, i) => (
      <Text key={i} style={[styles.heartIcon, i >= hearts && styles.heartEmpty]}>
        {i < hearts ? '❤️' : '🖤'}
      </Text>
    ))}
  </View>
);

// ── Main component ─────────────────────────────────────────────────────────
export default function LessonScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const { hearts, maxHearts, isPro, addXP, loseHeart, checkAndUpdateStreak } = useUserStore();
  const { completeUnit } = useProgressStore();
  const feedback = useGameFeedback();

  const [questions, setQuestions] = useState<APIQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [timerActive, setTimerActive] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXPAmount] = useState(10);
  const [finished, setFinished] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load questions ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const examType = unitIdToExamType(unitId ?? '');
        const exams = await getExamsByType(examType);
        if (!exams.length) throw new Error(`No ${examType} exam found`);
        const pool = await getRandomQuestions(exams[0].id, 50);

        const unit = getPythonUnitById(unitId ?? '');
        let qs = pool;
        if (unit) {
          const unitPrefix = `${unit.code}:`;
          const matched = pool.filter(q => q.domain.startsWith(unitPrefix));
          if (matched.length >= 5) {
            qs = matched.slice(0, 5);
          } else {
            qs = [...matched, ...pool.filter(q => !q.domain.startsWith(unitPrefix))].slice(0, 5);
          }
        } else {
          qs = pool.slice(0, 5);
        }

        setQuestions(qs);
        setTimerActive(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [unitId]);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerActive || showFeedback) return;
    timerInterval.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return QUESTION_TIME;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [timerActive, showFeedback, currentIndex]);

  const handleTimeout = useCallback(() => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    setTimerActive(false);
    feedback.triggerWrong();
    if (!isPro) loseHeart();
    setShowFeedback(true);
  }, [isPro, feedback, loseHeart]);

  const handleSelect = useCallback((letter: string) => {
    if (showFeedback) return;
    feedback.triggerSelect();
    setSelected(letter);
  }, [showFeedback, feedback]);

  const handleSubmit = useCallback(() => {
    if (!selected && !showFeedback) return;
    if (timerInterval.current) clearInterval(timerInterval.current);
    setTimerActive(false);

    const q = questions[currentIndex];
    const isCorrect = selected === q.correct_answer_letter;

    if (isCorrect) {
      const earnedXP = timeLeft > 60 ? 15 : 10; // speed bonus
      feedback.triggerCorrect();
      addXP(earnedXP);
      setXPAmount(earnedXP);
      setShowXP(true);
      setCorrectCount(c => c + 1);
      setTimeout(() => setShowXP(false), 1000);
    } else {
      feedback.triggerWrong();
      if (!isPro) loseHeart();
    }
    setShowFeedback(true);
  }, [selected, showFeedback, questions, currentIndex, timeLeft, isPro, feedback, addXP, loseHeart]);

  const handleNext = useCallback(() => {
    const isLast = currentIndex === questions.length - 1;
    if (isLast) {
      const score = Math.round((correctCount / questions.length) * 100);
      completeUnit(unitId as string, score);
      checkAndUpdateStreak();
      if (correctCount === questions.length) {
        feedback.triggerExamPassed();
        setShowConfetti(true);
      } else {
        feedback.triggerLessonComplete();
      }
      setFinished(true);
    } else {
      setCurrentIndex(i => i + 1);
      setSelected(null);
      setShowFeedback(false);
      setTimeLeft(QUESTION_TIME);
      setTimerActive(true);
    }
  }, [currentIndex, questions.length, correctCount, unitId, feedback, completeUnit, checkAndUpdateStreak]);

  // ── Render states ─────────────────────────────────────────────────────────
  if (loading) return (
    <SafeAreaView style={styles.centered}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Loading questions...</Text>
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={styles.centered}>
      <Text style={styles.errorEmoji}>😕</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
        <Text style={styles.retryBtnText}>Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  if (finished) return (
    <SafeAreaView style={styles.safe}>
      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{ x: width / 2, y: -10 }}
          fadeOut
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}
      <ScrollView contentContainerStyle={styles.resultScroll}>
        <Text style={styles.resultEmoji}>
          {correctCount === questions.length ? '🎉' : correctCount >= questions.length / 2 ? '👍' : '💪'}
        </Text>
        <Text style={styles.resultTitle}>Lesson Complete!</Text>
        <Text style={styles.resultScore}>
          {correctCount}/{questions.length} correct
        </Text>
        <View style={styles.starsRow}>
          {[1, 2, 3].map(n => (
            <Text key={n} style={{ fontSize: 40, opacity: n <= Math.ceil((correctCount / questions.length) * 3) ? 1 : 0.2 }}>
              ⭐
            </Text>
          ))}
        </View>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.back()}>
          <Text style={styles.ctaText}>Continue →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const q = questions[currentIndex];
  const timerPct = timeLeft / QUESTION_TIME;
  const timerColor = timerPct > 0.5 ? Colors.primary : timerPct > 0.25 ? Colors.warning : Colors.error;

  const getAnswerState = (letter: string): AnswerState => {
    if (!showFeedback) return selected === letter ? 'selected' : 'default';
    if (letter === q.correct_answer_letter) return 'correct';
    if (letter === selected) return 'wrong';
    return 'missed';
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* XP float */}
      <XPFloat amount={xpAmount} visible={showXP} />

      {/* Header: progress + hearts + quit */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.quitBtn}>
          <Text style={styles.quitBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${((currentIndex) / questions.length) * 100}%` },
            ]}
          />
        </View>
        <HeartsBar hearts={isPro ? 5 : hearts} max={isPro ? 5 : maxHearts} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Question counter + timer */}
        <View style={styles.questionMeta}>
          <Text style={styles.questionCounter}>
            {currentIndex + 1}/{questions.length}
          </Text>
          <Text style={[styles.timer, { color: timerColor }]}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </Text>
        </View>

        {/* Timer progress bar */}
        <View style={styles.timerBar}>
          <Animated.View
            style={[
              styles.timerFill,
              {
                width: `${timerPct * 100}%`,
                backgroundColor: timerColor,
              },
            ]}
          />
        </View>

        {/* Difficulty + Domain badges */}
        <View style={styles.badgeRow}>
          {q.difficulty && (
            <View style={[styles.badge, { backgroundColor: Colors[q.difficulty as 'easy' | 'medium' | 'hard'] + '25' }]}>
              <Text style={[styles.badgeText, { color: Colors[q.difficulty as 'easy' | 'medium' | 'hard'] }]}>
                {q.difficulty}
              </Text>
            </View>
          )}
          {q.domain && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{q.domain}</Text>
            </View>
          )}
        </View>

        {/* Question text */}
        <Text style={styles.questionText}>
          {q.question_text || q.question}
        </Text>

        {/* Answer options */}
        <View style={styles.answersContainer}>
          {q.answers.map(a => (
            <AnswerCard
              key={a.letter}
              letter={a.letter}
              text={a.text}
              state={getAnswerState(a.letter)}
              onPress={() => handleSelect(a.letter)}
              disabled={showFeedback}
            />
          ))}
        </View>

        {/* Submit / Next button */}
        {!showFeedback ? (
          <TouchableOpacity
            style={[styles.submitBtn, !selected && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!selected}
          >
            <Text style={styles.submitBtnText}>Submit Answer</Text>
          </TouchableOpacity>
        ) : (
          <Animated.View entering={SlideInDown.duration(300)}>
            {/* Feedback panel */}
            <View style={[
              styles.feedbackPanel,
              selected === q.correct_answer_letter
                ? styles.feedbackCorrect
                : styles.feedbackWrong,
            ]}>
              <Text style={styles.feedbackTitle}>
                {selected === q.correct_answer_letter
                  ? '✅ Correct!'
                  : selected === null
                  ? '⏱️ Time\'s Up!'
                  : '❌ Incorrect'}
              </Text>
              <Text style={styles.feedbackAnswer}>
                Correct answer: <Text style={styles.feedbackAnswerHighlight}>{q.correct_answer_letter}</Text>
              </Text>
              <Text style={styles.feedbackExplanation}>{q.explanation}</Text>
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentIndex === questions.length - 1 ? 'Finish Lesson 🎉' : 'Next Question →'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  centered: { flex: 1, backgroundColor: Colors.bgDeep, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.md },
  errorEmoji: { fontSize: 60 },
  errorText: { color: Colors.error, fontSize: FontSize.md, textAlign: 'center', paddingHorizontal: Spacing.lg },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  retryBtnText: { color: Colors.bgDeep, fontWeight: FontWeight.bold },

  // XP float
  xpFloat: { position: 'absolute', top: 100, right: Spacing.lg, zIndex: 999 },
  xpFloatText: { color: Colors.xpGold, fontWeight: FontWeight.black, fontSize: FontSize.lg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  quitBtn: { padding: Spacing.sm },
  quitBtnText: { color: Colors.textMuted, fontSize: FontSize.lg },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.bgMid,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  heartsRow: { flexDirection: 'row', gap: 2 },
  heartIcon: { fontSize: 18 },
  heartEmpty: { opacity: 0.3 },

  // Question
  scroll: { padding: Spacing.md, paddingBottom: 60 },
  questionMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  questionCounter: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  timer: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  timerBar: {
    height: 4,
    backgroundColor: Colors.bgMid,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  timerFill: { height: '100%', borderRadius: Radius.full },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: Colors.bgMid },
  badgeText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  questionText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    lineHeight: 26,
    marginBottom: Spacing.lg,
  },

  // Answers
  answersContainer: { gap: Spacing.sm, marginBottom: Spacing.lg },
  answerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 2,
    gap: Spacing.sm,
    minHeight: 56,
  },
  answerLetter: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerLetterText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  answerText: { flex: 1, fontSize: FontSize.md, lineHeight: 22 },
  answerIcon: { fontSize: FontSize.lg },

  // Submit button
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadow.md,
  },
  submitBtnDisabled: { backgroundColor: Colors.bgMid, opacity: 0.5 },
  submitBtnText: { color: Colors.bgDeep, fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  // Feedback panel
  feedbackPanel: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  feedbackCorrect: { backgroundColor: Colors.success + '15', borderColor: Colors.success + '40' },
  feedbackWrong: { backgroundColor: Colors.error + '15', borderColor: Colors.error + '40' },
  feedbackTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  feedbackAnswer: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm },
  feedbackAnswerHighlight: { color: Colors.textPrimary, fontWeight: FontWeight.bold },
  feedbackExplanation: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },

  // Next button
  nextBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  // Result screen
  resultScroll: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  resultEmoji: { fontSize: 80, marginBottom: Spacing.lg },
  resultTitle: { color: Colors.textPrimary, fontSize: FontSize.xxxl, fontWeight: FontWeight.black, marginBottom: Spacing.sm },
  resultScore: { color: Colors.xpGold, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.lg },
  starsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  ctaButton: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  ctaText: { color: Colors.bgDeep, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
