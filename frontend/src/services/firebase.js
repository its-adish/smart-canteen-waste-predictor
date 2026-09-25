import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC1nOhO-HvHUmZ832pU8PNhnKt04XiwkPQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "workshop-b96b6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "workshop-b96b6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "workshop-b96b6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "469841093222",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:469841093222:web:d7f6bbcd8ee606397183a7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-V5YN0E1HYC"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics conditionally (only in supported browser environments)
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not supported or blocked by client
  });
}

export default app;
