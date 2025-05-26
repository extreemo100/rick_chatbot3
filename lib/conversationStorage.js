// lib/conversationStorage.js
import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';

// Generate a unique session ID for anonymous users
const getSessionId = () => {
  let sessionId = localStorage.getItem('rick-session-id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('rick-session-id', sessionId);
  }
  return sessionId;
};

export const saveConversation = async (messages, audioUrl = null) => {
  try {
    const sessionId = getSessionId();
    const conversationData = {
      messages,
      lastAudioUrl: audioUrl,
      lastUpdated: Date.now(),
      createdAt: messages.length === 1 ? Date.now() : undefined
    };

    // Remove undefined values
    Object.keys(conversationData).forEach(key => 
      conversationData[key] === undefined && delete conversationData[key]
    );

    await setDoc(doc(db, 'conversations', sessionId), conversationData, { merge: true });
    console.log('Conversation saved to Firebase');
  } catch (error) {
    console.error('Error saving conversation:', error);
    // Fallback to localStorage if Firebase fails
    localStorage.setItem('rick-chatbot-conversations', JSON.stringify({
      messages,
      lastAudioUrl: audioUrl,
      timestamp: Date.now()
    }));
  }
};

export const saveMessage = async (message) => {
  try {
    const sessionId = getSessionId();
    
    await updateDoc(doc(db, 'conversations', sessionId), {
      messages: arrayUnion(message),
      lastUpdated: Date.now()
    });
    
    console.log('Message added to Firebase');
  } catch (error) {
    console.error('Error saving message:', error);
    // If document doesn't exist, create it with this message
    try {
      await setDoc(doc(db, 'conversations', sessionId), {
        messages: [message],
        lastUpdated: Date.now(),
        createdAt: Date.now()
      });
      console.log('New conversation created with message');
    } catch (createError) {
      console.error('Error creating new conversation:', createError);
    }
  }
};

export const loadConversation = async () => {
  try {
    const sessionId = getSessionId();
    const docRef = doc(db, 'conversations', sessionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Conversation loaded from Firebase');
      return {
        messages: data.messages || [],
        lastAudioUrl: data.lastAudioUrl || null
      };
    } else {
      console.log('No conversation found in Firebase');
      return { messages: [], lastAudioUrl: null };
    }
  } catch (error) {
    console.error('Error loading conversation:', error);
    // Fallback to localStorage if Firebase fails
    try {
      const saved = localStorage.getItem('rick-chatbot-conversations');
      if (saved) {
        const data = JSON.parse(saved);
        return {
          messages: data.messages || [],
          lastAudioUrl: data.lastAudioUrl || null
        };
      }
    } catch (localError) {
      console.error('Error loading from localStorage:', localError);
    }
    
    return { messages: [], lastAudioUrl: null };
  }
};

export const clearConversation = async () => {
  try {
    const sessionId = getSessionId();
    await deleteDoc(doc(db, 'conversations', sessionId));
    console.log('Conversation cleared from Firebase');
  } catch (error) {
    console.error('Error clearing conversation:', error);
  }
  
  // Also clear localStorage
  localStorage.removeItem('rick-chatbot-conversations');
  localStorage.removeItem('rick-session-id');
};