import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment variables
// In production, these are set in Render Dashboard
// For local dev, create a .env file with these values

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBqwwKHcW8QeyXPY2CKg4RB540OHKn24II",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aws-project-4f082.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aws-project-4f082",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aws-project-4f082.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "842382223034",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:842382223034:web:45f3375faa351dc5dc4483",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-766HV51E6Z"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Configure authentication providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const githubProvider = new GithubAuthProvider();
githubProvider.setCustomParameters({
  allow_signup: 'true'
});

export default app;

