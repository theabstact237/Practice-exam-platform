/**
 * Offered at 1 heart left — retry failed questions or a hard bonus question for +1 heart.
 */
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../constants/theme';
import { MascotGuide } from './MascotGuide';

interface HeartRecoveryModalProps {
  visible: boolean;
  subjectId?: string;
  failedCount: number;
  onRetryFailed: () => void;
  onBonusChallenge: () => void;
  onSkip: () => void;
}

export function HeartRecoveryModal({
  visible,
  subjectId,
  failedCount,
  onRetryFailed,
  onBonusChallenge,
  onSkip,
}: HeartRecoveryModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(350)} style={styles.card}>
          <Text style={styles.heartPulse}>💔 → ❤️</Text>
          <Text style={styles.title}>One heart left!</Text>

          <MascotGuide
            subjectId={subjectId}
            message={
              failedCount > 0
                ? `You missed ${failedCount} question${failedCount > 1 ? 's' : ''}. Retry them all perfectly, or take my hard bonus challenge to earn a heart back!`
                : 'Take my hard bonus challenge — answer correctly and you earn a heart back!'
            }
          />

          {failedCount > 0 && (
            <TouchableOpacity style={styles.optionBtn} onPress={onRetryFailed}>
              <Text style={styles.optionEmoji}>🔄</Text>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Retry failed questions</Text>
                <Text style={styles.optionSub}>
                  Answer all {failedCount} again — no mistakes allowed
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.optionBtn, styles.optionBonus]} onPress={onBonusChallenge}>
            <Text style={styles.optionEmoji}>⚡</Text>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>Bonus challenge</Text>
              <Text style={styles.optionSub}>One difficult direct question → +1 heart</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipText}>Continue with 1 heart (risky)</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.bgDeep,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.warning + '50',
  },
  heartPulse: { fontSize: 36, textAlign: 'center', marginBottom: Spacing.sm },
  title: {
    color: Colors.warning,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionBonus: { borderColor: Colors.primary + '60' },
  optionEmoji: { fontSize: 28 },
  optionTextWrap: { flex: 1 },
  optionTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  optionSub: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  skipText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
