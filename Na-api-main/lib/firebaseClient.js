import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

/**
 * Firebase client-side configuration for the Na-api-main dashboard.
 * Used for: Firebase Auth (user login), Realtime Database (bot command bridge)
 */
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDBpcfygHw2pCBrVtMp6dGeIRw2sCAC6TI",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dekut-app-main.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dekut-app-main",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dekut-app-main.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "227712751066",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:227712751066:web:1179019f15578e1de71ce3",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-1K8D7E0YZZ",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://dekut-app-main-default-rtdb.firebaseio.com",
};

// Initialize Firebase (singleton — safe for hot-reloading in dev)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase Auth instance for user authentication
const auth = getAuth(app);

// Firebase Realtime Database instance for bot command bridge
const database = getDatabase(app);

export { app, auth, database, firebaseConfig };
export default app;
