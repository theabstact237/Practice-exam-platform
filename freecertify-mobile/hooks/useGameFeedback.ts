/**
 * Central hook for all gamification feedback:
 * sound effects + haptic feedback + animation triggers.
 *
 * Every screen calls triggerCorrect() / triggerWrong() — never directly
 * invokes Haptics. This keeps all feedback logic in one place.
 *
 * NOTE ON AUDIO: `expo-av` is deprecated and is no longer available in the
 * Expo Go runtime for SDK 56 (the native module `ExponentAV` is gone). To add
 * sound later, migrate to the `expo-audio` package:
 *   1. `npx expo install expo-audio`
 *   2. add the mp3 files to assets/sounds/
 *   3. use `createAudioPlayer(require('../assets/sounds/x.mp3'))` and call
 *      `player.seekTo(0); player.play();` inside playSound().
 * For now playSound() is a no-op so the app runs cleanly; haptics still fire.
 */
import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../stores/useUserStore';

type SoundKey =
  | 'tap'
  | 'select'
  | 'correct'
  | 'wrong'
  | 'heartLost'
  | 'xpEarned'
  | 'levelUp'
  | 'streak'
  | 'lessonComplete'
  | 'examPassed';

export const useGameFeedback = () => {
  const { soundEnabled, hapticsEnabled, animationsReduced } = useUserStore();

  // Audio is disabled until migrated to expo-audio (see note above).
  const playSound = useCallback(
    (_key: SoundKey) => {
      if (!soundEnabled) return;
      // no-op for now
    },
    [soundEnabled],
  );

  const haptic = useCallback(
    async (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
      if (!hapticsEnabled) return;
      try {
        switch (type) {
          case 'light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
        }
      } catch {
        // Haptics unavailable on simulator
      }
    },
    [hapticsEnabled],
  );

  /** Correct answer — ascending ding + success haptic */
  const triggerCorrect = useCallback(() => {
    playSound('correct');
    haptic('success');
  }, [playSound, haptic]);

  /** Wrong answer — buzz + error haptic */
  const triggerWrong = useCallback(() => {
    playSound('wrong');
    haptic('error');
  }, [playSound, haptic]);

  /** Heart lost — crack sound + heavy haptic */
  const triggerHeartLost = useCallback(() => {
    playSound('heartLost');
    haptic('heavy');
    haptic('error');
  }, [playSound, haptic]);

  /** XP earned — coin sound + light haptic */
  const triggerXP = useCallback(() => {
    playSound('xpEarned');
    haptic('light');
  }, [playSound, haptic]);

  /** Level up — fanfare + 3x staggered success haptic */
  const triggerLevelUp = useCallback(() => {
    playSound('levelUp');
    haptic('success');
    setTimeout(() => haptic('success'), 200);
    setTimeout(() => haptic('success'), 400);
  }, [playSound, haptic]);

  /** Streak milestone — flame whoosh + success haptic */
  const triggerStreak = useCallback(() => {
    playSound('streak');
    haptic('success');
  }, [playSound, haptic]);

  /** Lesson complete — chime + success haptic */
  const triggerLessonComplete = useCallback(() => {
    playSound('lessonComplete');
    haptic('success');
  }, [playSound, haptic]);

  /** Exam passed — full celebration jingle */
  const triggerExamPassed = useCallback(() => {
    playSound('examPassed');
    haptic('success');
    setTimeout(() => haptic('success'), 300);
    setTimeout(() => haptic('success'), 600);
  }, [playSound, haptic]);

  /** Simple button tap — soft click + light haptic */
  const triggerTap = useCallback(() => {
    playSound('tap');
    haptic('light');
  }, [playSound, haptic]);

  /** Answer card selected — pop + medium haptic */
  const triggerSelect = useCallback(() => {
    playSound('select');
    haptic('medium');
  }, [playSound, haptic]);

  return {
    triggerCorrect,
    triggerWrong,
    triggerHeartLost,
    triggerXP,
    triggerLevelUp,
    triggerStreak,
    triggerLessonComplete,
    triggerExamPassed,
    triggerTap,
    triggerSelect,
    animationsReduced,
  };
};
