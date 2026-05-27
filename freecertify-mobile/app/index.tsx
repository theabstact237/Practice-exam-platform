/**
 * App entry point — decides whether to show onboarding or main tabs.
 */
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';

export default function Index() {
  useEffect(() => {
    const check = async () => {
      const onboarded = await AsyncStorage.getItem('freecertify_onboarded');
      if (onboarded === 'true') {
        router.replace('/(tabs)/learn');
      } else {
        router.replace('/onboarding');
      }
    };
    check();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
