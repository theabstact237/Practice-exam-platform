/**
 * AI tutor mascot — speech bubble guide for lesson events and system messages.
 */
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../constants/theme';
import { getSubjectById } from '../constants/subjects';

interface MascotGuideProps {
  subjectId?: string;
  message: string;
  compact?: boolean;
}

export function MascotGuide({ subjectId = 'python', message, compact }: MascotGuideProps) {
  const subject = getSubjectById(subjectId);
  const emoji = subject?.emoji ?? '🤖';
  const name = subject?.mascotLabel ?? 'Your AI Tutor';

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.avatar}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.bubble}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  wrapCompact: { marginBottom: Spacing.sm },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '50',
  },
  emoji: { fontSize: 28 },
  bubble: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  name: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
