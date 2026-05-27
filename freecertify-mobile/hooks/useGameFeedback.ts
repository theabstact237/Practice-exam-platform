/**
 * Central hook for all gamification feedback:
 * sound effects + haptic feedback + animation triggers.
 *
 * Every screen calls triggerCorrect() / triggerWrong() — never directly
 * invokes Audio or Haptics. This keeps all feedback logic in one place.
 */
import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
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

// Map each key to its asset. Replace with real files in assets/sounds/.
const SOUND_MAP: Record<SoundKey, any> = {
  tap: require('../assets/sounds/tap.mp3'),
  select: require('../assets/sounds/select.mp3'),
  correct: require('../assets/sounds/correct.mp3'),
  wrong: require('../assets/sounds/wrong.mp3'),
  heartLost: require('../assets/sounds/heart_lost.mp3'),
  xpEarned: require('../assets/sounds/xp_earned.mp3'),
  levelUp: require('../assets/sounds/level_up.mp3'),
  streak: require('../assets/sounds/streak.mp3'),
  lessonComplete: require('../assets/sounds/lesson_complete.mp3'),
  examPassed: require('../assets/sounds/exam_passed.mp3'),
};

export const useGameFeedback = () => {
  const { soundEnabled, hapticsEnabled, animationsReduced } = useUserStore();
  const sounds = useRef<Partial<Record<SoundKey, Audio.Sound>>>({});
  const loaded = useRef(false);

  // Preload all sounds once
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const load = async () => {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      for (const [key, asset] of Object.entries(SOUND_MAP)) {
        try {
          const { sound } = await Audio.Sound.createAsync(asset);
          sounds.current[key as SoundKey] = sound;
        } catch {
          // Sound file missing — skip gracefully
        }
      }
    };
    load();

    return () => {
      Object.values(sounds.current).forEach(s => s?.unloadAsync());
    };
  }, []);

  const playSound = useCallback(
    async (key: SoundKey) => {
      if (!soundEnabled) return;
      try {
        await sounds.current[key]?.replayAsync();
      } catch {
        // Sound unavailable — continue silently
      }
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
