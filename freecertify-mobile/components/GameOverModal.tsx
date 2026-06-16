/**
 * Shown when the player loses all hearts — blocks the lesson until they leave or wait.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../constants/theme';
import { MascotGuide } from './MascotGuide';

interface GameOverModalProps {
  visible: boolean;
  subjectId?: string;
  onContinue: () => void;
}

const COUNTDOWN_SECONDS = 10;

export function GameOverModal({ visible, subjectId, onContinue }: GameOverModalProps) {
  const [tick, setTick] = useState(1);
  const canContinue = tick >= COUNTDOWN_SECONDS;

  useEffect(() => {
    if (!visible) {
      setTick(1);
      return;
    }
    const id = setInterval(() => {
      setTick(prev => (prev < COUNTDOWN_SECONDS ? prev + 1 : prev));
    }, 1000);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(400)} style={styles.card}>
          <Text style={styles.emoji}>😢</Text>
          <Text style={styles.title}>You lose!</Text>
          <Text style={styles.subtitle}>All hearts are gone — take a breath and try again.</Text>

          <MascotGuide
            subjectId={subjectId}
            message="Every master coder fails questions before they ace them. Review the lesson topics, then come back stronger!"
            compact
          />

          <View style={styles.countdownBox}>
            <Text style={styles.countdownLabel}>Do you want to continue?</Text>
            <Text style={styles.countdownValue}>{canContinue ? 'Ready!' : tick}</Text>
            {!canContinue && (
              <Text style={styles.countdownHint}>Wait {COUNTDOWN_SECONDS - tick}s…</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.btn, !canContinue && styles.btnDisabled]}
            onPress={onContinue}
            disabled={!canContinue}
          >
            <Text style={styles.btnText}>{canContinue ? 'Continue →' : 'Please wait…'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.bgDeep,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    alignItems: 'center',
  },
  emoji: { fontSize: 72, marginBottom: Spacing.sm },
  title: {
    color: Colors.error,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  countdownBox: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    width: '100%',
  },
  countdownLabel: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  countdownValue: {
    color: Colors.primary,
    fontSize: 48,
    fontWeight: FontWeight.black,
    marginVertical: Spacing.xs,
  },
  countdownHint: { color: Colors.textMuted, fontSize: FontSize.sm },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    width: '100%',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: Colors.bgDeep, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
