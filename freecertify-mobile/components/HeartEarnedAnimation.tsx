/**
 * Full-screen burst when the player earns a heart back.
 */
import { useEffect } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, FontSize, FontWeight } from '../constants/theme';

interface HeartEarnedAnimationProps {
  visible: boolean;
  onDone: () => void;
}

export function HeartEarnedAnimation({ visible, onDone }: HeartEarnedAnimationProps) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    opacity.value = 1;
    scale.value = withSequence(
      withSpring(1.4, { damping: 8 }),
      withSpring(1, { damping: 10 }),
      withTiming(1, { duration: 600 }),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 900 }),
      withTiming(0, { duration: 400 }, finished => {
        if (finished) runOnJS(onDone)();
      }),
    );
  }, [visible]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.heartWrap, heartStyle]}>
          <Text style={styles.heart}>❤️</Text>
          <Text style={styles.label}>+1 Heart!</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartWrap: { alignItems: 'center' },
  heart: { fontSize: 100 },
  label: {
    color: Colors.error,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    marginTop: 8,
  },
});
