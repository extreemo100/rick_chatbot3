// lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBj42yZ-i1dPt5rAI8rbq1zYfAOsglUnRc",
  authDomain: "rick-chatbot.firebaseapp.com",
  projectId: "rick-chatbot",
  storageBucket: "rick-chatbot.firebasestorage.app",
  messagingSenderId: "351082060928",
  appId: "1:351082060928:web:29b58973567bbcbf82da65",
  measurementId: "G-39PECKXYV1"
};

// Initialize Firebase only if it hasn't been initialized
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth (optional)
export const auth = getAuth(app);

export default app;
