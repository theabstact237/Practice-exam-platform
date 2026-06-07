import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import { auth } from '../config/firebase';
import { useUserStore } from '../stores/useUserStore';
import { useProgressStore } from '../stores/useProgressStore';

export default function RootLayout() {
  const setUser = useUserStore(s => s.setUser);
  const loadUser = useUserStore(s => s.loadFromStorage);
  const loadProgress = useProgressStore(s => s.loadFromStorage);

  useEffect(() => {
    // Restore persisted gamification state from AsyncStorage
    loadUser();
    loadProgress();

    // Sync Firebase auth state → Zustand store.
    // onAuthStateChanged fires immediately with the current user (or null),
    // and again whenever the user signs in or out.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName ?? 'Learner',
          email: firebaseUser.email ?? '',
          photoURL: firebaseUser.photoURL ?? '',
        });
      } else {
        setUser(null);
      }
    });

    return unsubscribe; // Clean up listener on unmount
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
