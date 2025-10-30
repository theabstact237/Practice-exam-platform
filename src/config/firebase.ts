import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - Replace with your actual config

  const firebaseConfig = {
  apiKey: "AIzaSyBqwwKHcW8QeyXPY2CKg4RB540OHKn24II",
  authDomain: "aws-project-4f082.firebaseapp.com",
  projectId: "aws-project-4f082",
  storageBucket: "aws-project-4f082.firebasestorage.app",
  messagingSenderId: "842382223034",
  appId: "1:842382223034:web:45f3375faa351dc5dc4483",
  measurementId: "G-766HV51E6Z"
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

