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
  Alert,
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
import { API_BASE_URL } from '../../config/api';
import axios from 'axios';
import { getPythonUnitById, unitIdToExamType } from '../../constants/pythonSyllabus';
import {
  subjectIdFromUnit,
  extractHint,
  fetchBonusQuestion,
} from '../../utils/lessonHearts';
import { MascotGuide } from '../../components/MascotGuide';
import { GameOverModal } from '../../components/GameOverModal';
import { HeartRecoveryModal } from '../../components/HeartRecoveryModal';
import { HeartEarnedAnimation } from '../../components/HeartEarnedAnimation';
import { LoginToSaveNotice } from '../../components/LoginToSaveNotice';
import { CodeAwareText } from '../../components/CodeAwareText';

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
        <CodeAwareText style={[styles.answerText, { color: textColor }]}>{text}</CodeAwareText>
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
  const subjectId = subjectIdFromUnit(unitId ?? '');
  const { hearts, maxHearts, isPro, user, addXP, loseHeart, gainHeart, checkAndUpdateStreak } = useUserStore();
  const { completeUnit } = useProgressStore();
  const feedback = useGameFeedback();

  const [questions, setQuestions] = useState<APIQuestion[]>([]);
  const [examId, setExamId] = useState<number | null>(null);
  const [lessonMode, setLessonMode] = useState<'normal' | 'retry'>('normal');
  const [savedNormal, setSavedNormal] = useState<{ questions: APIQuestion[]; index: number } | null>(null);
  const [failedIndices, setFailedIndices] = useState<number[]>([]);
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
  const [pendingRecovery, setPendingRecovery] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showHeartEarned, setShowHeartEarned] = useState(false);
  const [bonusQuestion, setBonusQuestion] = useState<APIQuestion | null>(null);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [hintShown, setHintShown] = useState(false);

  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartsRef = useRef(hearts);
  heartsRef.current = hearts;

  const recordFailure = useCallback((index: number) => {
    setFailedIndices(prev => (prev.includes(index) ? prev : [...prev, index].sort((a, b) => a - b)));
  }, []);

  const handleHeartLoss = useCallback((questionIndex: number) => {
    if (isPro) return;
    recordFailure(questionIndex);
    const newHearts = Math.max(0, heartsRef.current - 1);
    loseHeart();
    if (newHearts <= 0) {
      setShowGameOver(true);
      setPendingRecovery(false);
    } else if (newHearts === 1) {
      setPendingRecovery(true);
    }
  }, [isPro, loseHeart, recordFailure]);

  const resetQuestionUI = useCallback(() => {
    setSelected(null);
    setShowFeedback(false);
    setHintShown(false);
    setTimeLeft(QUESTION_TIME);
    setTimerActive(true);
  }, []);

  const handleQuit = useCallback(() => {
    Alert.alert(
      'Quit lesson?',
      'Your progress in this lesson will be lost.',
      [
        { text: 'Keep learning', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: () => router.back() },
      ],
    );
  }, []);

  const awardHeartBack = useCallback(() => {
    gainHeart();
    setShowHeartEarned(true);
    setPendingRecovery(false);
    setShowRecovery(false);
  }, [gainHeart]);

  // ── Load questions ───────────────────────────────────────────────────────
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const examType = unitIdToExamType(unitId ?? '');
      const exams = await getExamsByType(examType);
      if (!exams.length) throw new Error(`No ${examType} exam found on the server.`);
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
      setExamId(exams[0].id);
      setTimerActive(true);
    } catch (e) {
      if (axios.isAxiosError(e) && !e.response) {
        setError(
          `Can't reach the backend at ${API_BASE_URL}.\n\n` +
          'Start Django on your PC:\npython manage.py runserver 0.0.0.0:8000\n\n' +
          'Phone and PC must be on the same Wi‑Fi.',
        );
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load questions');
      }
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    loadQuestions();
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [loadQuestions]);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerActive || showFeedback || showGameOver || showRecovery || bonusQuestion) return;
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
  }, [timerActive, showFeedback, showGameOver, showRecovery, bonusQuestion, currentIndex]);

  const handleTimeout = useCallback(() => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    setTimerActive(false);
    feedback.triggerWrong();
    if (lessonMode === 'retry') {
      if (!isPro) loseHeart();
      setShowGameOver(true);
    } else {
      handleHeartLoss(currentIndex);
    }
    setShowFeedback(true);
  }, [isPro, feedback, handleHeartLoss, currentIndex, lessonMode, loseHeart]);

  const handleSelect = useCallback((letter: string) => {
    if (showFeedback || showGameOver || bonusQuestion) return;
    feedback.triggerSelect();
    setSelected(letter);
  }, [showFeedback, showGameOver, bonusQuestion, feedback]);

  const handleSubmit = useCallback(() => {
    if (!selected && !showFeedback) return;
    if (timerInterval.current) clearInterval(timerInterval.current);
    setTimerActive(false);

    const q = questions[currentIndex];
    const isCorrect = selected === q.correct_answer_letter;

    if (isCorrect) {
      // Hint usage caps XP; otherwise speed bonus applies.
      const earnedXP = hintShown ? 5 : timeLeft > 60 ? 15 : 10;
      feedback.triggerCorrect();
      addXP(earnedXP);
      setXPAmount(earnedXP);
      setShowXP(true);
      setCorrectCount(c => c + 1);
      setTimeout(() => setShowXP(false), 1000);
    } else {
      feedback.triggerWrong();
      if (lessonMode === 'retry') {
        if (!isPro) loseHeart();
        setShowGameOver(true);
      } else {
        handleHeartLoss(currentIndex);
      }
    }
    setShowFeedback(true);
  }, [selected, showFeedback, questions, currentIndex, timeLeft, hintShown, isPro, feedback, addXP, handleHeartLoss, lessonMode, loseHeart]);

  const finishRetrySuccess = useCallback(() => {
    awardHeartBack();
    if (!savedNormal) return;
    const { questions: normalQs, index } = savedNormal;
    setQuestions(normalQs);
    setSavedNormal(null);
    setLessonMode('normal');
    const nextIndex = index + 1;
    if (nextIndex >= normalQs.length) {
      const score = Math.round((correctCount / normalQs.length) * 100);
      completeUnit(unitId as string, score);
      checkAndUpdateStreak();
      setFinished(true);
    } else {
      setCurrentIndex(nextIndex);
      resetQuestionUI();
    }
  }, [awardHeartBack, savedNormal, resetQuestionUI, correctCount, unitId, completeUnit, checkAndUpdateStreak]);

  const handleNext = useCallback(() => {
    if (showGameOver) return;

    if (pendingRecovery && lessonMode === 'normal') {
      setShowRecovery(true);
      return;
    }

    if (lessonMode === 'retry') {
      const isLast = currentIndex === questions.length - 1;
      const q = questions[currentIndex];
      const wasCorrect = selected === q.correct_answer_letter;

      if (!wasCorrect) return;

      if (isLast) {
        finishRetrySuccess();
        return;
      }
      setCurrentIndex(i => i + 1);
      resetQuestionUI();
      return;
    }

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
      resetQuestionUI();
    }
  }, [
    showGameOver, pendingRecovery, lessonMode, currentIndex, questions, selected,
    finishRetrySuccess, resetQuestionUI, correctCount, unitId, feedback,
    completeUnit, checkAndUpdateStreak,
  ]);

  const handleStartRetry = useCallback(() => {
    if (!failedIndices.length) return;
    setSavedNormal({ questions, index: currentIndex });
    setQuestions(failedIndices.map(i => questions[i]));
    setCurrentIndex(0);
    setLessonMode('retry');
    setShowRecovery(false);
    resetQuestionUI();
  }, [failedIndices, questions, currentIndex, resetQuestionUI]);

  const handleStartBonus = useCallback(async () => {
    if (!examId) return;
    setBonusLoading(true);
    setShowRecovery(false);
    try {
      const q = await fetchBonusQuestion(examId);
      if (!q) throw new Error('No bonus question available');
      setBonusQuestion(q);
      setSelected(null);
      setShowFeedback(false);
    } catch {
      setShowRecovery(true);
    } finally {
      setBonusLoading(false);
    }
  }, [examId]);

  const handleBonusSubmit = useCallback(() => {
    if (!bonusQuestion || !selected) return;
    const isCorrect = selected === bonusQuestion.correct_answer_letter;
    if (isCorrect) {
      feedback.triggerCorrect();
      setBonusQuestion(null);
      setSelected(null);
      awardHeartBack();
      resetQuestionUI();
    } else {
      feedback.triggerWrong();
      if (!isPro) loseHeart();
      setBonusQuestion(null);
      setShowGameOver(true);
      setPendingRecovery(false);
    }
  }, [bonusQuestion, selected, feedback, awardHeartBack, resetQuestionUI, isPro, loseHeart]);

  const handleSkipRecovery = useCallback(() => {
    setShowRecovery(false);
    setPendingRecovery(false);
    resetQuestionUI();
    const isLast = currentIndex === questions.length - 1;
    if (isLast) {
      const score = Math.round((correctCount / questions.length) * 100);
      completeUnit(unitId as string, score);
      checkAndUpdateStreak();
      setFinished(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [resetQuestionUI, currentIndex, questions.length, correctCount, unitId, completeUnit, checkAndUpdateStreak]);

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
      <TouchableOpacity style={styles.retryBtn} onPress={loadQuestions}>
        <Text style={styles.retryBtnText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>Go Back</Text>
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
        {!user && <LoginToSaveNotice subjectId={subjectId} variant="card" />}
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
      <GameOverModal
        visible={showGameOver}
        subjectId={subjectId}
        onContinue={() => router.back()}
      />
      <HeartRecoveryModal
        visible={showRecovery}
        subjectId={subjectId}
        failedCount={failedIndices.length}
        onRetryFailed={handleStartRetry}
        onBonusChallenge={handleStartBonus}
        onSkip={handleSkipRecovery}
      />
      <HeartEarnedAnimation
        visible={showHeartEarned}
        onDone={() => setShowHeartEarned(false)}
      />

      {/* Bonus heart challenge overlay */}
      {bonusQuestion && (
        <View style={styles.bonusOverlay}>
          <View style={styles.bonusCard}>
            <MascotGuide
              subjectId={subjectId}
              message="Bonus challenge! This one's tough — get it right and you earn a heart back."
            />
            {extractHint(bonusQuestion.explanation) && (
              <View style={styles.hintBox}>
                <Text style={styles.hintLabel}>💡 Hint</Text>
                <Text style={styles.hintText}>{extractHint(bonusQuestion.explanation)}</Text>
              </View>
            )}
            <CodeAwareText style={styles.questionText}>{bonusQuestion.question_text}</CodeAwareText>
            <View style={styles.answersContainer}>
              {bonusQuestion.answers.map(a => (
                <AnswerCard
                  key={a.letter}
                  letter={a.letter}
                  text={a.text}
                  state={selected === a.letter ? 'selected' : 'default'}
                  onPress={() => setSelected(a.letter)}
                  disabled={false}
                />
              ))}
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, !selected && styles.submitBtnDisabled]}
              onPress={handleBonusSubmit}
              disabled={!selected}
            >
              <Text style={styles.submitBtnText}>Submit Bonus Answer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={() => { setBonusQuestion(null); setShowRecovery(true); }}>
              <Text style={styles.skipText}>← Back to options</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {bonusLoading && (
        <View style={styles.bonusOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Preparing bonus challenge…</Text>
        </View>
      )}

      {/* XP float */}
      <XPFloat amount={xpAmount} visible={showXP} />

      {/* Header: progress + hearts + quit */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleQuit}
          style={styles.quitBtn}
          accessibilityRole="button"
          accessibilityLabel="Quit lesson"
        >
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

      {!user && <LoginToSaveNotice subjectId={subjectId} />}

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
        {lessonMode === 'retry' && (
          <MascotGuide
            subjectId={subjectId}
            message="Retry round — answer every missed question perfectly. One mistake ends the lesson!"
            compact
          />
        )}
        <CodeAwareText style={styles.questionText}>
          {q.question_text || q.question || ''}
        </CodeAwareText>

        {/* Hint (direct questions only) */}
        {!showFeedback && extractHint(q.explanation) && (
          hintShown ? (
            <View style={styles.hintBox}>
              <Text style={styles.hintLabel}>💡 Hint (-XP)</Text>
              <CodeAwareText style={styles.hintText}>{extractHint(q.explanation) ?? ''}</CodeAwareText>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.hintBtn}
              onPress={() => { feedback.triggerSelect(); setHintShown(true); }}
              accessibilityRole="button"
              accessibilityLabel="Show hint, reduces XP for this question"
            >
              <Text style={styles.hintBtnText}>💡 Show hint (caps XP at +5)</Text>
            </TouchableOpacity>
          )
        )}

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
              {selected !== q.correct_answer_letter && !showGameOver && (
                <MascotGuide
                  subjectId={subjectId}
                  message={
                    pendingRecovery
                      ? "That cost a heart! You have one left — I'll help you earn it back on the next step."
                      : 'No worries — read the explanation and keep going!'
                  }
                  compact
                />
              )}
              <Text style={styles.feedbackAnswer}>
                Correct answer: <Text style={styles.feedbackAnswerHighlight}>{q.correct_answer_letter}</Text>
              </Text>
              <CodeAwareText style={styles.feedbackExplanation}>{q.explanation}</CodeAwareText>
            </View>

            <TouchableOpacity
              style={[styles.nextBtn, showGameOver && styles.submitBtnDisabled]}
              onPress={handleNext}
              disabled={showGameOver}
            >
              <Text style={styles.nextBtnText}>
                {pendingRecovery && lessonMode === 'normal'
                  ? 'Choose recovery option →'
                  : lessonMode === 'retry' && currentIndex === questions.length - 1
                  ? 'Complete retry 🔄'
                  : currentIndex === questions.length - 1
                  ? 'Finish Lesson 🎉'
                  : 'Next Question →'}
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
  errorText: { color: Colors.error, fontSize: FontSize.md, textAlign: 'center', paddingHorizontal: Spacing.lg, lineHeight: 22, marginBottom: Spacing.md },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, marginTop: Spacing.sm },
  retryBtnText: { color: Colors.bgDeep, fontWeight: FontWeight.bold },
  backLink: { marginTop: Spacing.md, padding: Spacing.sm },
  backLinkText: { color: Colors.textSecondary, fontSize: FontSize.sm },

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

  bonusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  bonusCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: Colors.bgDeep,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
  },
  hintBox: {
    backgroundColor: Colors.warning + '18',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  hintLabel: { color: Colors.warning, fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: 4 },
  hintText: { color: Colors.textPrimary, fontSize: FontSize.sm, lineHeight: 18 },
  hintBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.warning + '18',
    borderColor: Colors.warning + '45',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  hintBtnText: { color: Colors.warning, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm, marginTop: Spacing.sm },
  skipText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
