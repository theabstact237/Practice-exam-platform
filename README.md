AWS Practice Exam Platform

This project is a web application designed to help users prepare for AWS certification exams. It provides a platform for taking practice exams, tracking progress, and reviewing answers. The application is built with modern web technologies and integrates with Firebase for authentication and data management.

Features

•
Practice Exams: Simulated exam environment for various AWS certifications

•
User Authentication: Secure sign-up and login with Google and GitHub

•
Progress Tracking: Users can track their scores and progress over time

•
Firestore Database: Store user data, exam results, and progress in a NoSQL database

•
Analytics: Google Analytics 4 integration to track user engagement and performance metrics

Tech Stack

•
Frontend: React, TypeScript, Vite, Tailwind CSS

•
Authentication: Firebase Authentication

•
Database: Firestore

•
Analytics: Google Analytics 4

•
Deployment: Netlify

Project Structure

The project is structured as a typical Vite + React application.

Plain Text


/
├── dist/                   # Production build directory
├── public/                 # Contains static assets
├── src/                    # Application source code
│   ├── components/         # Reusable React components
│   ├── config/             # Configuration files (Firebase)
│   │   └── firebase.ts     # Firebase initialization configuration
│   ├── utils/              # Utility functions (analytics)
│   │   └── analytics.ts    # Google Analytics configuration
│   ├── App.tsx             # Root application component
│   └── main.tsx            # Application entry point
├── .gitignore              # Files and folders ignored by Git
├── index.html              # HTML entry point
├── netlify.toml            # Netlify configuration file
├── package.json            # Project dependencies and scripts
├── README.md               # This file
└── vite.config.ts          # Vite configuration file


Note: The /src directory contains the core application logic and should be created according to the structure above.

Getting Started

Follow these instructions to set up and run the project locally.

Prerequisites

•
Node.js (version 18.x or higher)

•
npm (usually included with Node.js)

•
A Firebase account

•
A Google Analytics account

Local Setup Instructions

1.
Clone the repository:

2.
Install dependencies:

3.
Configure Firebase:

•
Follow the detailed instructions in the FIREBASE_SETUP.md file to create a Firebase project, enable authentication (Google & GitHub), and set up Firestore.

•
Create a firebase.ts file in the src/config/ directory.

•
Add your Firebase configuration to this file:



4.
Configure Google Analytics:

•
Follow the instructions in ANALYTICS_SETUP.md to create a Google Analytics 4 property.

•
Create an analytics.ts file in the src/utils/ directory.

•
Add your measurement ID to this file:



5.
Run the development server:

Available Scripts

•
npm run dev: Starts the Vite development server with hot module replacement

•
npm run build: Compiles the TypeScript application and builds it for production in the dist directory

•
npm run preview: Serves the production build locally for preview

Deployment

This project is pre-configured for easy deployment on Netlify. The netlify.toml file contains the necessary build settings.

1.
Push your code to a GitHub repository

2.
Connect your repository to Netlify

3.
Configure environment variables for your Firebase and Google Analytics configuration keys in the Netlify site settings

4.
Trigger a deployment. Netlify will automatically run the npm run build command and deploy the contents of the dist directory

Configuration Files

Firebase Setup

See FIREBASE_SETUP.md for detailed instructions on:

•
Creating a Firebase project

•
Enabling Google and GitHub authentication

•
Setting up Firestore database

•
Configuring security rules

•
Understanding the data structure

Analytics Setup

See ANALYTICS_SETUP.md for detailed instructions on:

•
Creating a Google Analytics 4 property

•
Configuring event tracking

•
Understanding tracked metrics

•
Creating custom reports

Dependencies

Core Dependencies

•
React (18.2.0): UI library

•
React DOM (18.2.0): React rendering for web

•
Firebase (11.10.0): Backend services (auth, database)

•
React Firebase Hooks (5.1.1): React hooks for Firebase

•
React GA4 (2.1.0): Google Analytics 4 integration

•
Lucide React (0.330.0): Icon library

•
Recharts (3.0.2): Charting library for data visualization

•
Font Awesome (6.7.2): Additional icon library

Development Dependencies

•
TypeScript (5.2.2): Type-safe JavaScript

•
Vite (5.0.8): Build tool and dev server

•
Tailwind CSS (3.4.1): Utility-first CSS framework

•
PostCSS (8.4.33): CSS processing

•
Autoprefixer (10.4.17): CSS vendor prefixing

Browser Support

This application supports all modern browsers that are compatible with ES6+ and React 18:

•
Chrome (latest)

•
Firefox (latest)

•
Safari (latest)

•
Edge (latest)

License

This project is private and proprietary.

Contributing

If you'd like to contribute to this project, please follow these steps:

1.
Fork the repository

2.
Create a feature branch (git checkout -b feature/amazing-feature)

3.
Commit your changes (git commit -m 'Add some amazing feature')

4.
Push to the branch (git push origin feature/amazing-feature)

5.
Open a Pull Request

Support

For issues, questions, or contributions, please open an issue in the GitHub repository.

