# Firebase Setup Instructions for Authentication

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: "AWS Practice Exam Platform"
4. Enable Google Analytics (optional but recommended)
5. Choose or create a Google Analytics account
6. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable the following providers:

### Google Sign-In
- Click on "Google"
- Toggle "Enable"
- Enter your project support email
- Click "Save"

### GitHub Sign-In
- Click on "GitHub"
- Toggle "Enable"
- You'll need to create a GitHub OAuth App:
  1. Go to GitHub Settings > Developer settings > OAuth Apps
  2. Click "New OAuth App"
  3. Fill in:
     - Application name: "AWS Practice Exam Platform"
     - Homepage URL: Your app URL (e.g., https://azdscsyk.manus.space)
     - Authorization callback URL: `https://your-project-id.firebaseapp.com/__/auth/handler`
  4. Copy Client ID and Client Secret to Firebase
- Click "Save"

## Step 3: Enable Firestore Database

1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Click "Done"

## Step 4: Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add a web app
4. Enter app nickname: "AWS Practice Exam Web"
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"
7. Copy the configuration object

## Step 5: Update Configuration Files

Replace the configuration in `/src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id" // Optional
};
```

## Step 6: Configure Firestore Security Rules

In the Firestore Database, go to "Rules" tab and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow reading of public data (if any)
    match /public/{document=**} {
      allow read: if true;
    }
  }
}
```

## Step 7: Test Authentication

1. Build and deploy your app
2. Try signing in with Google and GitHub
3. Check the Firebase Console > Authentication > Users to see registered users
4. Check Firestore > Data to see user profiles being created

## Data Structure

The app creates user documents in Firestore with this structure:

```javascript
/users/{userId} {
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  provider: 'google' | 'github',
  createdAt: timestamp,
  lastLoginAt: timestamp,
  examProgress: {
    solutionsArchitect: number,
    cloudPractitioner: number
  },
  preferences: {
    preferredExamType: string,
    emailNotifications: boolean
  }
}
```

## Marketing Analytics Integration

The authentication system automatically tracks:
- User registration events
- Login attempts and successes
- Provider preferences (Google vs GitHub)
- User engagement and progress
- Email collection for marketing

## Privacy Compliance

- Users can delete their accounts through Firebase Auth
- All data is stored securely in Firestore
- Email addresses are only used for progress tracking and optional notifications
- No sensitive personal information is collected beyond what's provided by OAuth providers

## Troubleshooting

### Common Issues:
1. **"Firebase not initialized"** - Check that firebase.ts is properly imported
2. **"Auth domain not authorized"** - Add your domain to Firebase Auth settings
3. **"GitHub OAuth error"** - Verify GitHub OAuth app callback URL matches Firebase
4. **"Firestore permission denied"** - Check security rules allow user access

### Testing Locally:
- Use `localhost:3000` or `127.0.0.1:3000` for local development
- Add these domains to Firebase Auth authorized domains
- GitHub OAuth may require HTTPS in production

