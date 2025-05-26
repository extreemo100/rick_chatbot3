// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBj42yZ-i1dPt5rAI8rbq1zYfAOsglUnRc",
  authDomain: "rick-chatbot.firebaseapp.com",
  projectId: "rick-chatbot",
  storageBucket: "rick-chatbot.firebasestorage.app",
  messagingSenderId: "351082060928",
  appId: "1:351082060928:web:29b58973567bbcbf82da65",
  measurementId: "G-39PECKXYV1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);