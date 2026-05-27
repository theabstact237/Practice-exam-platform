# FreeCertify Mobile

A gamified tech education platform — learn Python, JavaScript, Java, AWS/Cloud, Prompt Engineering, and AI Fundamentals in daily 5-minute lessons with Duolingo-style engagement mechanics.

## Tech Stack

- **Framework:** React Native + Expo SDK 56
- **Navigation:** expo-router (file-based routing)
- **Animations:** react-native-reanimated v3
- **Celebrations:** react-native-confetti-cannon + lottie-react-native
- **Haptics:** expo-haptics
- **Sound:** expo-av
- **State:** Zustand (persisted via AsyncStorage)
- **API:** Axios → FreeCertify Django backend
- **Auth:** @react-native-firebase/auth

## Project Structure

```
freecertify-mobile/
├── app/
│   ├── _layout.tsx          Root layout (GestureHandler, StatusBar)
│   ├── index.tsx            Entry point (onboarding check)
│   ├── onboarding.tsx       4-step onboarding wizard
│   ├── (tabs)/
│   │   ├── learn.tsx        Skill tree + subject selector
│   │   ├── leaderboard.tsx  Weekly league
│   │   ├── progress.tsx     Stats dashboard
│   │   ├── tutor.tsx        AI Study Tutor chat
│   │   └── profile.tsx      User profile + settings
│   └── lesson/
│       └── [unitId].tsx     Gamified lesson screen (core experience)
├── constants/
│   ├── theme.ts             Colors, spacing, typography tokens
│   └── subjects.ts          Subject definitions
├── stores/
│   ├── useUserStore.ts      XP, streak, hearts, settings
│   └── useProgressStore.ts  Unit completion, stars
├── hooks/
│   └── useGameFeedback.ts   Central sound + haptic + animation hook
├── utils/
│   └── api.ts               Django backend API calls
└── assets/
    ├── sounds/              MP3 sound effects (see sounds/README.md)
    ├── animations/          Lottie JSON files
    └── images/              App icon, splash, mascots
```

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for quick testing)

### Install
```bash
cd freecertify-mobile
npm install
```

### Environment Variables
Create a `.env` file:
```
EXPO_PUBLIC_API_URL=https://aws-exam-backend.onrender.com
```

### Run
```bash
# Start Expo dev server
npx expo start

# Scan QR code with Expo Go on your phone
# OR press 'a' for Android emulator, 'i' for iOS simulator
```

### Build for App Store / Play Store
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure builds
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Adding Sound Files

See `assets/sounds/README.md` for the list of required MP3 files and where to download free sound effects.

## Adding Lottie Animations

Download JSON animations from [LottieFiles.com](https://lottiefiles.com) and place them in `assets/animations/`. Reference in `hooks/useGameFeedback.ts`.

## Backend Connection

This app connects to the same Django backend as the web app. Ensure the backend is running:
```bash
cd ../backend
python manage.py runserver
```

Or set `EXPO_PUBLIC_API_URL` to your deployed Render URL.

## Roadmap

See `../MOBILE_APP_SPEC.md` for the full product specification and development roadmap.
