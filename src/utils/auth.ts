import { 
  signInWithPopup, 
  signOut, 
  User,
  UserCredential 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, googleProvider, githubProvider, db } from '../config/firebase';
import { analytics } from './analytics';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: string;
  createdAt: any;
  lastLoginAt: any;
  examProgress?: {
    solutionsArchitect?: number;
    cloudPractitioner?: number;
  };
  preferences?: {
    preferredExamType?: string;
    emailNotifications?: boolean;
  };
}

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential | null> => {
  try {
    analytics.paymentLinkClicked('google_auth_attempt');
    const result = await signInWithPopup(auth, googleProvider);
    
    // Save user data to Firestore
    await saveUserProfile(result.user, 'google');
    
    analytics.paymentLinkClicked('google_auth_success');
    return result;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    analytics.questionLoadError('auth', 'google_signin_failed');
    return null;
  }
};

// Sign in with GitHub
export const signInWithGitHub = async (): Promise<UserCredential | null> => {
  try {
    analytics.paymentLinkClicked('github_auth_attempt');
    const result = await signInWithPopup(auth, githubProvider);
    
    // Save user data to Firestore
    await saveUserProfile(result.user, 'github');
    
    analytics.paymentLinkClicked('github_auth_success');
    return result;
  } catch (error) {
    console.error('Error signing in with GitHub:', error);
    analytics.questionLoadError('auth', 'github_signin_failed');
    return null;
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    analytics.paymentLinkClicked('user_signout');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

// Save user profile to Firestore
const saveUserProfile = async (user: User, provider: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    const userData: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      provider: provider,
      createdAt: userSnap.exists() ? userSnap.data().createdAt : serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      examProgress: userSnap.exists() ? userSnap.data().examProgress : {
        solutionsArchitect: 0,
        cloudPractitioner: 0
      },
      preferences: userSnap.exists() ? userSnap.data().preferences : {
        preferredExamType: 'solutions_architect',
        emailNotifications: true
      }
    };
    
    await setDoc(userRef, userData, { merge: true });
    
    // Track user registration/login for analytics
    if (!userSnap.exists()) {
      analytics.contactFormSubmitted(true); // New user registration
    }
    
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
};

// Update user exam progress
export const updateUserProgress = async (
  userId: string, 
  examType: string, 
  questionNumber: number
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const progressField = examType === 'solutions_architect' 
      ? 'examProgress.solutionsArchitect' 
      : 'examProgress.cloudPractitioner';
    
    await setDoc(userRef, {
      [progressField]: questionNumber,
      lastLoginAt: serverTimestamp()
    }, { merge: true });
    
  } catch (error) {
    console.error('Error updating user progress:', error);
  }
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Update user preferences
export const updateUserPreferences = async (
  userId: string, 
  preferences: Partial<UserProfile['preferences']>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      preferences: preferences,
      lastLoginAt: serverTimestamp()
    }, { merge: true });
    
  } catch (error) {
    console.error('Error updating user preferences:', error);
  }
};

