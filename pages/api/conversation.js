// pages/api/conversation.js
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';

// Firebase configuration
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

const db = getFirestore(app);

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Session-ID'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const sessionId = req.headers['x-session-id'];
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Load conversation history
        const docRef = doc(db, 'conversations', sessionId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          res.status(200).json({
            messages: data.messages || [],
            lastAudioUrl: data.lastAudioUrl || null
          });
        } else {
          res.status(200).json({ messages: [], lastAudioUrl: null });
        }
        break;

      case 'POST':
        // Save a single message
        const { message } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        try {
          // Try to update existing document
          await updateDoc(doc(db, 'conversations', sessionId), {
            messages: arrayUnion(message),
            lastUpdated: Date.now()
          });
        } catch (error) {
          // If document doesn't exist, create it
          await setDoc(doc(db, 'conversations', sessionId), {
            messages: [message],
            lastUpdated: Date.now(),
            createdAt: Date.now()
          });
        }
        
        res.status(200).json({ success: true });
        break;

      case 'DELETE':
        // Clear conversation
        await deleteDoc(doc(db, 'conversations', sessionId));
        res.status(200).json({ success: true });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Conversation API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}