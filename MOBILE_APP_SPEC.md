# Mobile Application — Product & Technical Specification

**Project Name:** FreeCertify Mobile (working title)
**Version:** 1.0 — Initial Spec
**Date:** May 2026
**Author:** Karl Siaka
**Status:** Pre-development

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Mission & Vision](#2-mission--vision)
3. [Target Audience](#3-target-audience)
4. [Core Features](#4-core-features)
5. [Content Structure](#5-content-structure)
6. [Question Types](#6-question-types)
7. [Gamification System](#7-gamification-system)
8. [Screen Architecture & Navigation](#8-screen-architecture--navigation)
9. [Screen-by-Screen Specification](#9-screen-by-screen-specification)
10. [Animation & Feedback System](#10-animation--feedback-system)
11. [Tech Stack](#11-tech-stack)
12. [Backend Architecture](#12-backend-architecture)
13. [Authentication & User Data](#13-authentication--user-data)
14. [AI-Powered Features](#14-ai-powered-features)
15. [Offline Support](#15-offline-support)
16. [Accessibility](#16-accessibility)
17. [Development Roadmap](#17-development-roadmap)
18. [Folder Structure](#18-folder-structure)

---

## 1. Product Overview

FreeCertify Mobile is a **gamified, bite-sized tech education platform** built for mobile-first learners. Inspired by Duolingo's engagement model, the app teaches programming fundamentals, cloud computing, artificial intelligence, and prompt engineering through short daily lessons, interactive challenges, and reward-driven progression.

Unlike traditional e-learning platforms that rely on video lectures and passive consumption, FreeCertify Mobile is built around **active recall**, **spaced repetition**, and **daily habit formation** — the most scientifically proven methods for long-term skill retention.

### What Makes It Different

- Gamified learning loop (XP, streaks, hearts, leagues) applied to **tech education**
- Covers **6 subjects** in one app: Python, JavaScript, Java, AWS/Cloud, Prompt Engineering, AI Fundamentals
- Real, shareable **completion certificates** that can be posted on LinkedIn
- **AI tutor** built into every lesson for instant personalized explanations
- Completely **free to start** — no credit card, no barrier to entry

---

## 2. Mission & Vision

### Mission
> Democratize tech education by making it accessible, engaging, and free for every learner on the planet — regardless of background, income, or prior experience.

### Vision
To become the world's go-to mobile platform for learning technology fundamentals, reaching learners who cannot afford traditional bootcamps or university programs, particularly in underserved and emerging markets.

### Core Values
- **Accessibility** — Free tier must be genuinely valuable, never crippled
- **Engagement** — Learning should feel like playing, not studying
- **Relevance** — Content maps directly to job market needs
- **Inclusion** — Multilingual support, offline mode, low-data mode planned

---

## 3. Target Audience

### Primary Users

| Segment | Description | Pain Point |
|---|---|---|
| Career changers | Non-tech professionals wanting to break into tech | Traditional bootcamps are too expensive and time-consuming |
| Students | University students supplementing their CS degree | Lectures are boring and passive |
| Self-taught developers | Already coding, want to fill knowledge gaps and get certified | No structured, bite-sized path |
| Working professionals | DevOps, IT, or business analysts upskilling in AI/Cloud | No time for long courses |
| Emerging market learners | Learners in Africa, Southeast Asia, Latin America | Content paywalled or inaccessible |

### Secondary Users
- Companies purchasing team licenses for employee training
- Bootcamp instructors recommending the app as a daily supplement
- Recruiting teams identifying certified talent through the platform

### User Persona Example

**"Amara, 26, Abidjan, Côte d'Ivoire"**
- Business administration graduate, no coding background
- Has a smartphone, uses mobile data (limited bandwidth)
- Goal: learn Python and get AWS certified to work remotely
- Barrier: Cannot afford $500 bootcamps or Coursera subscriptions
- How FreeCertify helps: Free daily lessons, offline mode, gamification keeps her coming back every day

---

## 4. Core Features

### Free Tier
- Daily lessons across all 6 subjects
- 5 hearts per session (replenish over time)
- Streak tracking and leaderboard participation
- Basic progress dashboard
- Practice certificates (watermarked)
- AI tutor (3 hints/day)
- Ads between lessons

### Pro Tier ($6.99/month or $49.99/year)
- Unlimited daily lessons
- Unlimited hearts
- Ad-free experience
- Full certificates (PDF, shareable, LinkedIn-ready)
- Unlimited AI tutor access
- Offline mode (download lesson packs)
- Advanced analytics (weak topic heatmap, time spent, accuracy trends)
- Streak repair (once per month)
- Early access to new subjects

### Feature Flags (future)
- Multiplayer challenge mode (battle a friend)
- Live coding exercises
- Video micro-lessons (60 seconds)
- Community forums per subject
- Job board integration

---

## 5. Content Structure

The content is organized into a 4-level hierarchy:

```
Subject  →  World  →  Unit  →  Lesson (5–10 questions)
```

### Subject 1: Python 🐍
```
World 1: Python Foundations
  Unit 1: Variables & Data Types        (5 lessons)
  Unit 2: Strings & Formatting          (5 lessons)
  Unit 3: Control Flow (if/else)        (5 lessons)
  Unit 4: Loops                         (5 lessons)
  Unit 5: Functions                     (5 lessons)

World 2: Data Structures
  Unit 6: Lists                         (5 lessons)
  Unit 7: Dictionaries                  (5 lessons)
  Unit 8: Tuples & Sets                 (4 lessons)
  Unit 9: List Comprehensions           (4 lessons)

World 3: Object-Oriented Python
  Unit 10: Classes & Objects            (6 lessons)
  Unit 11: Inheritance                  (5 lessons)
  Unit 12: Error Handling               (5 lessons)

World 4: Real-World Python
  Unit 13: File I/O                     (4 lessons)
  Unit 14: Working with APIs            (5 lessons)
  Unit 15: Libraries (requests, json)   (5 lessons)
```

### Subject 2: JavaScript ⚡
```
World 1: JS Fundamentals
  Unit 1: Variables (var/let/const)     (5 lessons)
  Unit 2: Functions & Arrow Functions   (5 lessons)
  Unit 3: Arrays & Array Methods        (6 lessons)
  Unit 4: Objects                       (5 lessons)

World 2: The DOM & Browser
  Unit 5: DOM Manipulation              (5 lessons)
  Unit 6: Events                        (5 lessons)
  Unit 7: Fetch & Promises              (5 lessons)

World 3: Modern JavaScript
  Unit 8: ES6+ Features                 (6 lessons)
  Unit 9: Async/Await                   (5 lessons)
  Unit 10: Modules                      (4 lessons)

World 4: React Basics (Bonus)
  Unit 11: Components & Props           (5 lessons)
  Unit 12: State & Hooks                (5 lessons)
```

### Subject 3: Java ☕
```
World 1: Java Basics
  Unit 1: Syntax & Types                (5 lessons)
  Unit 2: Control Structures            (5 lessons)
  Unit 3: Methods                       (5 lessons)

World 2: Object-Oriented Java
  Unit 4: Classes & Objects             (6 lessons)
  Unit 5: Inheritance & Polymorphism    (6 lessons)
  Unit 6: Interfaces & Abstract Classes (5 lessons)

World 3: Java Collections & APIs
  Unit 7: ArrayList & HashMap           (5 lessons)
  Unit 8: Exception Handling            (5 lessons)
  Unit 9: Java Streams                  (5 lessons)
```

### Subject 4: AWS & Cloud ☁️
```
World 1: Cloud Foundations
  Unit 1: What is Cloud Computing       (5 lessons)
  Unit 2: AWS Global Infrastructure     (4 lessons)
  Unit 3: Pricing & Billing             (4 lessons)

World 2: Core Services
  Unit 4: EC2 Compute                   (6 lessons)
  Unit 5: S3 Storage                    (5 lessons)
  Unit 6: RDS & DynamoDB                (5 lessons)
  Unit 7: VPC Networking                (5 lessons)
  Unit 8: IAM Security                  (6 lessons)

World 3: Architect-Level
  Unit 9: Load Balancers & Auto Scaling (5 lessons)
  Unit 10: CloudFront & Route 53        (4 lessons)
  Unit 11: Serverless (Lambda, API GW)  (5 lessons)

World 4: Mock Exams (Boss Levels)
  Boss 1: Cloud Practitioner Exam       (65 questions)
  Boss 2: Solutions Architect Exam      (65 questions)
  Boss 3: Developer Associate Exam      (65 questions)
```

### Subject 5: Prompt Engineering ✍️
```
World 1: Prompt Foundations
  Unit 1: What is a Prompt?             (4 lessons)
  Unit 2: Anatomy of a Good Prompt      (5 lessons)
  Unit 3: Zero-Shot vs Few-Shot         (5 lessons)

World 2: Advanced Techniques
  Unit 4: Chain-of-Thought Prompting    (5 lessons)
  Unit 5: Role & Persona Prompting      (4 lessons)
  Unit 6: Prompt Templates              (5 lessons)

World 3: Applied Prompting
  Unit 7: Prompts for Code Generation   (5 lessons)
  Unit 8: Prompts for Data Analysis     (4 lessons)
  Unit 9: Prompts for Content Writing   (4 lessons)

World 4: Safety & Ethics
  Unit 10: Prompt Injection Attacks     (4 lessons)
  Unit 11: Jailbreaking & Guardrails    (4 lessons)
  Unit 12: Responsible AI Use           (4 lessons)
```

### Subject 6: AI Fundamentals 🧠
```
World 1: AI Concepts
  Unit 1: What is Machine Learning?     (5 lessons)
  Unit 2: Supervised vs Unsupervised    (4 lessons)
  Unit 3: Neural Networks Explained     (5 lessons)

World 2: Large Language Models
  Unit 4: How LLMs Work                 (5 lessons)
  Unit 5: Tokens, Context & Temperature (4 lessons)
  Unit 6: GPT, Claude, Gemini — Differences (4 lessons)

World 3: Applied AI
  Unit 7: AI in the Workplace           (4 lessons)
  Unit 8: Building with AI APIs         (5 lessons)
  Unit 9: Vector Databases & RAG        (4 lessons)

World 4: AI Ethics & Society
  Unit 10: Bias in AI                   (4 lessons)
  Unit 11: AI Regulation & Policy       (3 lessons)
  Unit 12: The Future of AI             (3 lessons)
```

---

## 6. Question Types

### Type 1: Multiple Choice (MCQ)
Standard 4-option question. Used across all subjects.
```
Question: Which AWS service is used for object storage?
A) EC2    B) S3    C) RDS    D) Lambda
```

### Type 2: Code Fill-in-the-Blank
A code snippet with one blank. Learner taps the correct option.
```
def greet(name):
    return _______ + name

A) "Hello, "    B) Hello    C) f"Hello"    D) print
```

### Type 3: Code Output Prediction
Learner reads code and predicts what it prints/returns.
```
x = [1, 2, 3, 4, 5]
print(x[1:3])

A) [1, 2]    B) [2, 3]    C) [1, 2, 3]    D) [3, 4, 5]
```

### Type 4: Tap the Correct Word (Duolingo-style)
A sentence with a blank. Answer words appear as tappable chips below.
```
"In JavaScript, _______ is used to declare a constant variable."

[var]  [let]  [const]  [function]
```

### Type 5: True / False
Simple binary choice with explanation shown after.
```
"Python lists are immutable."
→ [TRUE]  [FALSE]
```

### Type 6: Prompt Rating / Rewriting
Unique to the Prompt Engineering track.
```
Rank these prompts from worst to best for generating a Python sort function:
A) "sort list"
B) "Write a Python function that sorts integers ascending"
C) "Python"
D) "Can you help me maybe sort something?"
```

### Type 7: Sequence Ordering
Learner drags items into the correct order. Used for algorithms and processes.
```
Put these steps in the correct order to define a class in Python:
[ ] Add methods
[ ] Write class keyword and name
[ ] Define __init__ constructor
[ ] Add instance attributes
```
*(Uses `react-native-draggable-flatlist`)*

### Type 8: Code Matching
Match terms on the left to definitions on the right via drag or tap.
```
lambda    →  [ Anonymous function ]
def       →  [ Function declaration ]
return    →  [ Output a value ]
yield     →  [ Generator function ]
```

---

## 7. Gamification System

### 7.1 Hearts (Lives)
- Users start each session with **5 hearts** ❤️
- A wrong answer or timeout costs **1 heart**
- Hearts refill at **1 per 30 minutes** (free) or **instant** (Pro)
- At 0 hearts: session ends, user must wait or watch an ad to refill instantly
- **Heart Shield**: purchasable with gems, protects hearts for one full lesson

### 7.2 XP (Experience Points)
Earned for completing lessons and quality of answers:

| Action | XP Earned |
|---|---|
| Complete a lesson | +10 XP |
| Perfect lesson (no mistakes) | +15 XP |
| Speed bonus (answer < 10 seconds) | +5 XP |
| Daily goal hit | +20 XP |
| Combo streak (5 correct in a row) | +2x multiplier for next 3 questions |
| Study 2+ subjects in one day | +50 XP bonus |
| Complete a world (all units) | +100 XP |

### 7.3 Daily Streak 🔥
- Studying at least one lesson per day maintains the streak
- Streak displayed prominently on home screen
- Push notification sent if streak is at risk (2 hours before midnight)
- **Streak Milestones** trigger celebrations: Day 7, 30, 100, 365
- **Streak Repair** (Pro only): repair one missed day per month
- **Streak Shield** (earned via achievements): auto-protects one missed day

### 7.4 Leagues & Leaderboard
Weekly competition among users of similar level:

| League | Icon | Users | Promotion | Relegation |
|---|---|---|---|---|
| Bronze | 🥉 | 30 users/group | Top 5 promote | Bottom 10 demote |
| Silver | 🥈 | 30 users/group | Top 5 promote | Bottom 10 demote |
| Gold | 🥇 | 30 users/group | Top 5 promote | Bottom 10 demote |
| Diamond | 💎 | 30 users/group | Top 3 stay | Bottom 5 demote |

Leagues reset weekly. XP earned that week determines ranking.

### 7.5 Gems 💎
Secondary currency earned through:
- Perfect lessons (+2 gems)
- Daily login bonus (+1 gem)
- Completing a full world (+10 gems)
- Sharing a certificate (+5 gems)

Gems spent on:
- Instant heart refill (5 gems)
- Streak freeze (10 gems)
- Bonus XP boosts (15 gems)

### 7.6 Achievements & Badges

| Badge | Name | Trigger |
|---|---|---|
| 🏆 | First Pass | Pass a Boss Exam for the first time |
| 🔥 | On Fire | 7-day streak |
| 🌊 | Unstoppable | 30-day streak |
| ⚡ | Speed Demon | Answer 10 questions in under 8 seconds each |
| 🎯 | Sharpshooter | Perfect score on 5 lessons in a row |
| 🌩 | Cloud Master | Complete all AWS worlds |
| 🐍 | Pythonista | Complete all Python worlds |
| 🤖 | AI Native | Complete Prompt Engineering + AI Fundamentals |
| 🌍 | Polyglot Dev | Study 3+ programming subjects |
| 👑 | Legend | Reach Diamond league |

### 7.7 Subject Mastery Level
Each subject has an independent level from 1 to 50:
- Visual level badge displayed on the user's profile
- Level milestones unlock bonus content and cosmetic rewards
- Level 50 in a subject = "Master" status with special badge

---

## 8. Screen Architecture & Navigation

```
App Entry
├── Splash Screen
├── Onboarding (first-time only)
│     ├── Screen 1: Goal selection
│     ├── Screen 2: Experience level
│     ├── Screen 3: Subject selection
│     └── Screen 4: Daily goal & notifications
│
└── Main App (Bottom Tab Navigation)
      ├── Tab 1: Learn       (Skill tree / daily challenge)
      ├── Tab 2: Leaderboard (Weekly league)
      ├── Tab 3: Progress    (Stats, streaks, heatmap)
      ├── Tab 4: AI Tutor    (Chat-based study assistant)
      └── Tab 5: Profile     (Certificates, badges, settings)
```

### Stack Navigators Inside Tabs

```
Learn Tab
  ├── SubjectSelectScreen
  ├── SkillTreeScreen (per subject)
  ├── UnitOverviewScreen
  ├── LessonScreen (active question screen)
  └── LessonResultScreen

Leaderboard Tab
  ├── LeagueScreen
  └── FriendsLeaderboardScreen

Progress Tab
  ├── ProgressDashboardScreen
  ├── SubjectDetailScreen
  └── StreakCalendarScreen

AI Tutor Tab
  ├── TutorHomeScreen
  └── TutorChatScreen

Profile Tab
  ├── ProfileScreen
  ├── CertificatesScreen
  ├── BadgesScreen
  └── SettingsScreen
        ├── AccountSettings
        ├── NotificationSettings
        ├── SoundSettings
        └── SubscriptionScreen
```

---

## 9. Screen-by-Screen Specification

### 9.1 Onboarding Flow

**Goal Selection Screen**
- Question: "What's your goal?"
- Options (tappable cards with icons):
  - 🚀 Get a tech job
  - 🎓 Pass a certification
  - 💡 Learn to code for fun
  - 📈 Upskill as a professional
- Progress dots at top (1 of 4)

**Experience Level Screen**
- Question: "What's your coding background?"
- Options:
  - 👶 Complete beginner
  - 📚 Some experience
  - 💼 Working professional
- Used to personalize skill tree starting point

**Subject Selection Screen**
- Question: "Pick your first track"
- 6 animated subject cards, each with mascot icon and color theme
- Recommended tag appears on best match for their goal
- Can select one to start (more unlock later)

**Daily Goal Screen**
- Question: "How much time can you commit daily?"
- Slider or 4 options: 5 min / 10 min / 15 min / 20 min
- Toggle: Enable daily reminder? → triggers `expo-notifications` permission request
- CTA: "Start Learning" → animated transition to main app

---

### 9.2 Learn Tab — Skill Tree Screen

**Layout:**
- Subject selector at top (horizontal scroll of subject chips)
- Vertical skill tree below (scrollable)
- Each node is a circular unit button
- Connecting lines between nodes (SVG or react-native-svg)
- Locked units appear grey with a lock icon
- Completed units have a star count (0–3 stars based on accuracy)
- Current unit pulses gently (Reanimated loop animation)

**Unit States:**
- `locked` — Grey, lock icon, not tappable
- `available` — Colored, bouncing slightly
- `in_progress` — Progress ring around the circle
- `completed_1star` — Gold circle, 1 star
- `completed_3star` — Gold circle, 3 stars (perfect)

**Bottom persistent bar:**
- "Daily Challenge" button — highlighted if not yet done today
- Current streak count + fire emoji

---

### 9.3 Lesson Screen (Core Experience)

This is the most important screen in the app.

**Layout:**
```
[Progress bar across top]            [Heart count ❤️❤️❤️❤️❤️]
[XP count]                           [Quit button]

[Question card - center of screen]
  - Difficulty badge (Easy / Medium / Hard)
  - Domain/topic tag
  - Question text (large, readable)
  - Code block (if applicable, monospace font with syntax highlight)

[Answer options - bottom half]
  - 4 option cards (or tap-word chips, or drag items)
  - Large touch targets (minimum 52px height)

[Submit button - bottom]
```

**Answer States:**
- Default: slate/neutral background
- Selected: highlighted border + background tint
- Correct (after submit): green background + checkmark animation
- Wrong (after submit): red background + shake animation

**Timer:**
- Subtle circular progress ring around the question number indicator
- Turns orange at 50% time remaining
- Turns red and pulses at 25% remaining
- No harsh countdown numbers (reduces anxiety vs web app)

**Feedback Panel (slides up after submit):**
- Green panel (correct): celebration Lottie animation, "+10 XP" floats up
- Red panel (wrong): explanation shown, correct answer highlighted
- "Continue" button at bottom — advances to next question

---

### 9.4 Lesson Result Screen

Shown after completing all questions in a lesson.

**Sections:**
- Score header: "3/5 Correct" with animated ring
- Star rating: 1–3 stars animate in one by one
- XP earned: counter animates up to final number
- Breakdown: each question shown as correct/wrong/timed out
- Confetti Lottie if 5/5 perfect
- Buttons: "Continue" (next unit) / "Practice Again"

---

### 9.5 Progress Tab

**Stats Cards Row:**
- Total XP (all time)
- Current streak
- Lessons completed
- Accuracy rate (%)

**Subject Progress Grid:**
- Each subject shown as a card with level badge, progress bar, last studied date

**Streak Calendar:**
- GitHub contribution-style calendar heatmap
- Green = studied, grey = missed, gold = perfect day (all lessons perfect)

**Weak Topics Heatmap (Pro only):**
- Grid showing accuracy per topic
- Red = below 60%, yellow = 60–80%, green = above 80%

---

### 9.6 AI Tutor Tab

- Subject selector at top
- Syllabus/topic picker
- Chat interface (same as existing AIAssistantModal in web app)
- Streamed AI responses with typing indicator
- Quick prompt chips: "Explain this concept", "Give me an example", "Quiz me"
- Off-topic guard: only answers questions related to the selected subject

---

### 9.7 Profile Tab

**Header:**
- Avatar (Firebase photo or uploaded)
- Display name
- Member since date
- Subject mastery levels (horizontal scroll)

**Sections:**
- My Certificates — tappable cards, each opens shareable PDF certificate
- My Badges — grid of earned achievement badges (greyed out = locked)
- Study Stats — total time studied, questions answered, accuracy rate

**Settings Entry:**
- Account, Notifications, Sound & Haptics, Subscription, Privacy, Logout

---

## 10. Animation & Feedback System

### 10.1 Core Animation Library
**`react-native-reanimated` v3** — all animations run on the UI thread for 60fps performance.

### 10.2 Animation Catalog

| Animation | Trigger | Implementation |
|---|---|---|
| Card bounce on tap | Answer card pressed | `withSpring(0.95)` → `withSpring(1)` |
| Card shake | Wrong answer | `withSequence` of translateX values |
| Slide-up panel | Feedback panel appears | `withSpring` translateY from +300 to 0 |
| Progress bar fill | After answer | `withTiming` width change |
| XP float-up | XP earned | `withTiming` translateY + opacity fade |
| Heart shatter | Heart lost | Lottie animation |
| Star pop-in | Result screen | `withSpring` scale 0 → 1 with delay stagger |
| Confetti burst | Perfect lesson | `react-native-confetti-cannon` |
| Trophy spin | Exam passed | Lottie animation |
| Streak fire pulse | Streak milestone | Lottie loop animation |
| Screen transition | Navigate between lessons | Shared element transition |
| Skill tree node pulse | Current available unit | Reanimated `withRepeat` |

### 10.3 Sound Events

| Event | Sound |
|---|---|
| Any button tap | Soft click (< 10ms) |
| Answer selected | Highlight pop |
| Correct answer | Ascending ding |
| Wrong answer | Low buzz |
| Heart lost | Crack/shatter |
| XP earned | Coin collect |
| Level up | Short fanfare |
| Streak milestone | Flame whoosh |
| Lesson complete | Completion chime |
| Exam passed | Full celebration jingle |

Sound library: `expo-av`. Free SFX from Freesound.org, Mixkit.co, Zapsplat.com.

### 10.4 Haptic Events

| Event | Haptic Type |
|---|---|
| Button tap | `Light` impact |
| Answer selected | `Medium` impact |
| Correct answer | `Success` notification |
| Wrong answer | `Error` notification |
| Heart lost | `Heavy` + `Error` |
| Level up | `Success` × 3 staggered |
| Lesson complete | `Success` notification |

Library: `expo-haptics`.

### 10.5 Central Feedback Hook

All feedback is managed through a single reusable hook:

```typescript
// hooks/useGameFeedback.ts
const useGameFeedback = () => {
  const triggerCorrect = () => { /* sound + haptic + animation */ };
  const triggerWrong   = () => { /* sound + haptic + shake */     };
  const triggerLevelUp = () => { /* fanfare + confetti + haptic */};
  return { triggerCorrect, triggerWrong, triggerLevelUp };
};
```

### 10.6 Accessibility — Reduced Motion
Check `AccessibilityInfo.isReduceMotionEnabled()` on mount. If true:
- Replace springs/bounces with instant transitions
- Disable particle effects and Lottie animations
- Keep haptics and sounds (user controls these separately)

---

## 11. Tech Stack

### Mobile App

| Layer | Technology | Reason |
|---|---|---|
| Framework | React Native + Expo SDK 52 | Cross-platform, TypeScript, large ecosystem |
| Navigation | expo-router v4 | File-based routing, typed routes |
| Animations | react-native-reanimated v3 | UI-thread animations, 60fps |
| Gestures | react-native-gesture-handler | Swipe, drag, pinch |
| Lottie | lottie-react-native | JSON-based celebration animations |
| Haptics | expo-haptics | iOS/Android vibration |
| Sound | expo-av | Audio playback |
| Confetti | react-native-confetti-cannon | Celebration effect |
| Drag/Drop | react-native-draggable-flatlist | Ordering question type |
| SVG | react-native-svg | Skill tree connecting lines |
| Storage | react-native-mmkv | Ultra-fast local key-value store |
| Charts | react-native-gifted-charts | Progress heatmap, domain bars |
| Notifications | expo-notifications | Streak reminders |
| Auth | Firebase Auth (react-native-firebase) | Same as web app |
| API | Axios + React Query | API calls + caching |
| State | Zustand | Lightweight global state |
| Code highlight | react-native-syntax-highlighter | Code blocks in questions |
| Ads | react-native-google-mobile-ads | AdMob integration |
| Analytics | @react-native-firebase/analytics | User behavior tracking |

### Development Tools

| Tool | Purpose |
|---|---|
| TypeScript | Type safety |
| ESLint + Prettier | Code quality |
| Jest + RNTL | Unit testing |
| Detox | E2E testing |
| EAS Build | Cloud builds for App Store / Play Store |
| EAS Update | OTA updates (bug fixes without app store review) |

---

## 12. Backend Architecture

### Existing (Reuse Without Changes)
- Django REST API (all question endpoints)
- Firebase Auth (user authentication)
- Existing analytics endpoints
- AI assistant / chat streaming endpoint

### New Models to Add (Django)

```python
# subjects/models.py
class Subject(models.Model):
    slug        = models.SlugField(unique=True)   # 'python', 'aws', etc.
    name        = models.CharField(max_length=100)
    description = models.TextField()
    color       = models.CharField(max_length=7)  # hex color
    icon        = models.CharField(max_length=50)
    order       = models.PositiveIntegerField()

class World(models.Model):
    subject     = models.ForeignKey(Subject, on_delete=models.CASCADE)
    title       = models.CharField(max_length=200)
    order       = models.PositiveIntegerField()

class Unit(models.Model):
    world       = models.ForeignKey(World, on_delete=models.CASCADE)
    title       = models.CharField(max_length=200)
    order       = models.PositiveIntegerField()
    xp_reward   = models.PositiveIntegerField(default=10)

class Lesson(models.Model):
    unit        = models.ForeignKey(Unit, on_delete=models.CASCADE)
    title       = models.CharField(max_length=200)
    order       = models.PositiveIntegerField()
    questions   = models.ManyToManyField('Question', through='LessonQuestion')

class QuestionType(models.TextChoices):
    MCQ           = 'mcq'
    FILL_BLANK    = 'fill_blank'
    OUTPUT_PRED   = 'output_predict'
    TAP_WORD      = 'tap_word'
    TRUE_FALSE    = 'true_false'
    ORDERING      = 'ordering'
    MATCHING      = 'matching'
    PROMPT_RATING = 'prompt_rating'

# gamification/models.py
class UserProgress(models.Model):
    user_uid    = models.CharField(max_length=128)
    unit        = models.ForeignKey(Unit, on_delete=models.CASCADE)
    completed   = models.BooleanField(default=False)
    stars       = models.PositiveIntegerField(default=0)  # 0-3
    best_score  = models.FloatField(default=0)
    completed_at = models.DateTimeField(null=True)

class UserStreak(models.Model):
    user_uid    = models.CharField(max_length=128, unique=True)
    current     = models.PositiveIntegerField(default=0)
    longest     = models.PositiveIntegerField(default=0)
    last_study_date = models.DateField(null=True)
    streak_shield_count = models.PositiveIntegerField(default=0)

class UserXP(models.Model):
    user_uid    = models.CharField(max_length=128, unique=True)
    total_xp    = models.PositiveIntegerField(default=0)
    weekly_xp   = models.PositiveIntegerField(default=0)
    subject_xp  = models.JSONField(default=dict)  # {subject_slug: xp}

class Achievement(models.Model):
    slug        = models.SlugField(unique=True)
    name        = models.CharField(max_length=100)
    description = models.TextField()
    icon        = models.CharField(max_length=50)
    xp_reward   = models.PositiveIntegerField(default=0)

class UserAchievement(models.Model):
    user_uid    = models.CharField(max_length=128)
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_at   = models.DateTimeField(auto_now_add=True)

class LeaderboardEntry(models.Model):
    user_uid    = models.CharField(max_length=128)
    week_start  = models.DateField()
    xp          = models.PositiveIntegerField(default=0)
    league      = models.CharField(max_length=20, default='bronze')
```

### New API Endpoints

```
GET  /api/subjects/                         List all subjects + user progress
GET  /api/subjects/{slug}/tree/             Full skill tree with user progress overlay
GET  /api/units/{id}/lessons/               Lessons in a unit
GET  /api/lessons/{id}/questions/           Questions for a lesson
POST /api/progress/lesson-complete/         Record lesson completion, award XP
POST /api/streak/check-in/                  Daily streak update
GET  /api/leaderboard/weekly/               Current week's top users
GET  /api/achievements/                     All achievements + user's earned set
POST /api/achievements/check/               Trigger achievement evaluation
GET  /api/user/xp/                          User's XP breakdown
```

---

## 13. Authentication & User Data

- **Auth Provider:** Firebase Authentication (same as web app)
- Users sign in with Google or Email/Password
- Firebase UID is the universal user identifier across web + mobile
- Progress syncs automatically — a user can study on web and continue on mobile seamlessly
- Guest mode: users can try 3 lessons without signing in, then prompted to create account

---

## 14. AI-Powered Features

### AI Tutor (Tab 4)
- Reuses existing `streamChatWithSyllabusAssistant` backend endpoint
- Subject-scoped: AI only answers questions relevant to the selected subject
- Off-topic detection with graceful redirect message
- Typing indicator animation while streaming
- Quick prompt chips for common questions

### Contextual Hints (In-Lesson)
- "I don't understand" button on every question
- Sends question context + user's selected (wrong) answer to AI
- AI generates a personalized explanation in plain language
- Free users: 3 hints/day. Pro users: unlimited.

### Adaptive Difficulty (Future — Phase 2)
- After each unit, ML model adjusts next unit's difficulty
- Based on: accuracy rate, average answer time, number of hints used
- Spaced repetition: questions you got wrong reappear in future lessons

---

## 15. Offline Support

### Pro Feature
- Users can download individual subject worlds for offline use
- Downloaded lessons stored via `react-native-mmkv` (fast) + SQLite for questions
- Completed lessons sync to server when connectivity restored
- Streak protection: if user studied offline, streak is preserved on next sync

### Always Available (Free + Pro)
- Cached version of last-accessed skill tree
- Previously loaded questions available without re-fetching
- Graceful offline state UI (no jarring errors)

---

## 16. Accessibility

- **Reduced Motion:** Respects `AccessibilityInfo.isReduceMotionEnabled()`
- **Screen Reader:** All interactive elements have `accessibilityLabel` props
- **Font Scaling:** UI tested with system font size up to 200%
- **Color Contrast:** All text meets WCAG AA minimum (4.5:1 ratio)
- **Touch Targets:** Minimum 44×44pt per Apple HIG / Material guidelines
- **Sound Toggle:** Global setting to disable all sound effects
- **Haptics Toggle:** Global setting to disable haptic feedback
- **High Contrast Mode:** Dark theme with higher contrast option planned for v1.1

---

## 17. Development Roadmap

### Phase 0 — Pre-Development (2 weeks)
- [ ] Finalize content for Python World 1 (25 questions minimum)
- [ ] Finalize content for AWS World 1 (25 questions minimum)
- [ ] Design system: color palette, typography, spacing scale
- [ ] Mascot designs for all 6 subjects
- [ ] Lottie animation sourcing (confetti, hearts, stars, fire)
- [ ] Sound effect sourcing and licensing
- [ ] App name finalization and branding

### Phase 1 — MVP (8–10 weeks)
- [ ] Expo project setup with TypeScript + expo-router
- [ ] Firebase Auth integration (Google + Email)
- [ ] Onboarding flow (4 screens)
- [ ] Learn tab: Subject select + Skill tree (Python + AWS only)
- [ ] Lesson screen with MCQ + Fill-in-blank question types
- [ ] Hearts system
- [ ] XP system + streak tracking
- [ ] Lesson result screen with stars
- [ ] Basic Progress tab (streak counter, XP total)
- [ ] Basic Profile tab (avatar, display name, sign out)
- [ ] AdMob integration (between lessons)
- [ ] Backend: New subject/unit/lesson models + endpoints
- [ ] TestFlight (iOS) + Internal Testing (Android) release

### Phase 2 — Full Feature Set (8–10 weeks)
- [ ] All 6 subjects + full content for each
- [ ] All 8 question types
- [ ] Full gamification: Leagues, badges, achievements, gems
- [ ] AI Tutor tab
- [ ] Leaderboard tab
- [ ] Certificates (Pro) + shareable PDF
- [ ] Pro subscription via RevenueCat
- [ ] Push notifications (streak reminders)
- [ ] Full animation suite (Lottie, confetti, haptics, sounds)
- [ ] Full Progress tab (heatmap, subject detail)
- [ ] App Store + Play Store public launch

### Phase 3 — Growth & Monetization (ongoing)
- [ ] B2B/Teams web portal
- [ ] Verified certificates via Credly / OpenBadges
- [ ] Affiliate exam voucher integration
- [ ] Multiplayer challenge mode
- [ ] Offline mode (Pro)
- [ ] Multilingual support (French, Spanish, Portuguese)
- [ ] Live coding exercises (in-app code editor)
- [ ] Community features (study groups, forums)

---

## 18. Folder Structure

```
freecertify-mobile/
├── app/                          # expo-router pages
│     ├── (tabs)/
│     │     ├── learn/
│     │     │     ├── index.tsx         # Subject select
│     │     │     ├── [subject]/
│     │     │     │     ├── index.tsx   # Skill tree
│     │     │     │     └── [unit]/
│     │     │     │           ├── index.tsx  # Unit overview
│     │     │     │           └── lesson.tsx # Active lesson
│     │     ├── leaderboard.tsx
│     │     ├── progress.tsx
│     │     ├── tutor.tsx
│     │     └── profile/
│     │           ├── index.tsx
│     │           └── settings.tsx
│     ├── onboarding/
│     │     ├── goal.tsx
│     │     ├── experience.tsx
│     │     ├── subject.tsx
│     │     └── dailygoal.tsx
│     └── auth/
│           ├── login.tsx
│           └── signup.tsx
│
├── components/
│     ├── ui/                    # Reusable design system components
│     │     ├── Button.tsx
│     │     ├── Card.tsx
│     │     ├── Badge.tsx
│     │     ├── ProgressBar.tsx
│     │     └── Avatar.tsx
│     ├── lesson/
│     │     ├── QuestionCard.tsx
│     │     ├── AnswerOption.tsx
│     │     ├── FeedbackPanel.tsx
│     │     ├── HeartBar.tsx
│     │     ├── XPCounter.tsx
│     │     └── TimerRing.tsx
│     ├── skill-tree/
│     │     ├── SkillNode.tsx
│     │     ├── ConnectorLine.tsx
│     │     └── WorldHeader.tsx
│     ├── gamification/
│     │     ├── LeagueCard.tsx
│     │     ├── StreakBadge.tsx
│     │     ├── AchievementCard.tsx
│     │     └── XPBar.tsx
│     └── overlays/
│           ├── LessonCompleteOverlay.tsx
│           ├── HeartEmptyOverlay.tsx
│           └── LevelUpOverlay.tsx
│
├── hooks/
│     ├── useGameFeedback.ts     # Central sound + haptic + animation hook
│     ├── useStreak.ts
│     ├── useXP.ts
│     ├── useHearts.ts
│     └── useLesson.ts
│
├── stores/                      # Zustand global state
│     ├── useUserStore.ts
│     ├── useProgressStore.ts
│     └── useSettingsStore.ts
│
├── utils/
│     ├── api.ts                 # All API calls (reused from web app)
│     ├── auth.ts                # Firebase auth (reused from web app)
│     ├── analytics.ts           # Analytics events
│     └── sounds.ts              # Sound preloading + playback
│
├── constants/
│     ├── subjects.ts            # Subject definitions, colors, icons
│     ├── achievements.ts        # Achievement definitions
│     └── theme.ts               # Design tokens
│
├── assets/
│     ├── animations/            # Lottie JSON files
│     ├── sounds/                # MP3/WAV sound effects
│     ├── images/                # Mascots, illustrations
│     └── fonts/                 # Custom typography
│
└── __tests__/
```

---

*Document maintained by Karl Siaka. Update version number and date with each major revision.*
