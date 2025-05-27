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

  console.log(`${req.method} request for session: ${sessionId}`);

  try {
    switch (req.method) {
      case 'GET':
        // Load conversation history
        const docRef = doc(db, 'conversations', sessionId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log(`Loaded ${data.messages?.length || 0} messages for session ${sessionId}`);
          res.status(200).json({
            messages: data.messages || [],
            lastAudioUrl: data.lastAudioUrl || null
          });
        } else {
          console.log(`No existing conversation found for session ${sessionId}`);
          res.status(200).json({ messages: [], lastAudioUrl: null });
        }
        break;

      case 'POST':
        // Save a single message
        const { message } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`Saving message for session ${sessionId}:`, message.role);

        try {
          const docRef = doc(db, 'conversations', sessionId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            // Update existing document
            await updateDoc(docRef, {
              messages: arrayUnion(message),
              lastUpdated: Date.now()
            });
            console.log('Message added to existing conversation');
          } else {
            // Create new document
            await setDoc(docRef, {
              messages: [message],
              lastUpdated: Date.now(),
              createdAt: Date.now()
            });
            console.log('New conversation created with message');
          }
        } catch (error) {
          console.error('Error saving message:', error);
          throw error;
        }
        
        res.status(200).json({ success: true });
        break;

      case 'PUT':
        // Update audio URL
        const { audioUrl } = req.body;
        
        if (!audioUrl) {
          return res.status(400).json({ error: 'Audio URL is required' });
        }

        console.log(`Saving audio URL for session ${sessionId}`);

        try {
          const docRef = doc(db, 'conversations', sessionId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            await updateDoc(docRef, {
              lastAudioUrl: audioUrl,
              lastUpdated: Date.now()
            });
            console.log('Audio URL saved successfully');
          } else {
            // Create document with audio URL if it doesn't exist
            await setDoc(docRef, {
              messages: [],
              lastAudioUrl: audioUrl,
              lastUpdated: Date.now(),
              createdAt: Date.now()
            });
            console.log('New conversation created with audio URL');
          }
        } catch (error) {
          console.error('Error saving audio URL:', error);
          throw error;
        }
        
        res.status(200).json({ success: true });
        break;

      case 'DELETE':
        // Clear conversation
        console.log(`Deleting conversation for session ${sessionId}`);
        try {
          await deleteDoc(doc(db, 'conversations', sessionId));
          console.log('Conversation deleted successfully');
          res.status(200).json({ success: true });
        } catch (error) {
          console.error('Error deleting conversation:', error);
          throw error;
        }
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Conversation API error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
