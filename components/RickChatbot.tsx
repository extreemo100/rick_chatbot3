import React, { useState, useRef, useEffect } from 'react';
import { Send, Volume2, RotateCcw, Trash2 } from 'lucide-react';
import { saveMessage, loadConversation, clearConversation } from '../lib/conversationStorage';

const RickChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [pendingMessage, setPendingMessage] = useState(null); // Store message until audio plays
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [memoryLoaded, setMemoryLoaded] = useState(false); // Track if conversation is loaded
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history on component mount
  useEffect(() => {
    const loadConversationHistory = async () => {
      try {
        const data = await loadConversation();
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
          if (data.lastAudioUrl) {
            setAudioUrl(data.lastAudioUrl);
          }
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
      } finally {
        setMemoryLoaded(true);
      }
    };

    loadConversationHistory();
  }, []);

  // Handle audio playback when audioUrl updates
  useEffect(() => {
    if (audioUrl && audioRef.current && pendingMessage) {
      setIsPlayingAudio(true);
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      audioRef.current.play().catch(err => {
        console.error('Playbook error', err);
        // If audio fails to play, show message immediately
        addMessageToState(pendingMessage);
        setPendingMessage(null);
        setIsPlayingAudio(false);
      });
    }
  }, [audioUrl, pendingMessage]);

  // Handle audio end event
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleAudioEnd = () => {
      if (pendingMessage) {
        addMessageToState(pendingMessage);
        setPendingMessage(null);
      }
      setIsPlayingAudio(false);
    };

    const handleAudioError = () => {
      if (pendingMessage) {
        addMessageToState(pendingMessage);
        setPendingMessage(null);
      }
      setIsPlayingAudio(false);
    };

    audio.addEventListener('ended', handleAudioEnd);
    audio.addEventListener('error', handleAudioError);

    return () => {
      audio.removeEventListener('ended', handleAudioEnd);
      audio.removeEventListener('error', handleAudioError);
    };
  }, [pendingMessage]);

  // Helper function to add message to state and save to Firebase
  const addMessageToState = async (message) => {
    setMessages(prev => {
      const newMessages = [...prev, message];
      // Save to Firebase asynchronously
      saveMessage(message).catch(error => {
        console.error('Error saving message to Firebase:', error);
      });
      return newMessages;
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !memoryLoaded) return;

    const userMessage = { role: 'user', content: inputMessage, timestamp: Date.now() };
    
    // Add user message to state and save to Firebase
    await addMessageToState(userMessage);
    
    setInputMessage('');
    setIsLoading(true);

    try {
      const currentMessages = [...messages, userMessage];
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentMessages.slice(-10)
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const rickMessage = { 
        role: 'assistant', 
        content: data.message, 
        timestamp: Date.now() 
      };

      // If there's audio, store message as pending and play audio first
      if (data.audioUrl) {
        setPendingMessage(rickMessage);
        setAudioUrl(data.audioUrl);
      } else {
        // No audio, show message immediately and save to Firebase
        await addMessageToState(rickMessage);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Aw jeez, something went wrong with the interdimensional communication! Try again, *burp*', 
        timestamp: Date.now() 
      };
      await addMessageToState(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await clearConversation();
      setMessages([]);
      setAudioUrl(null);
      setPendingMessage(null);
      setIsPlayingAudio(false);
    } catch (error) {
      console.error('Error clearing conversation history:', error);
    }
  };

  const replayAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Don't render until conversation is loaded
  if (!memoryLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Loading Rick's memory... 🧪</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-black bg-opacity-50 backdrop-blur-sm border-b border-green-400">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl md:text-4xl font-bold text-green-400 text-center">
            🧪 Rick Sanchez AI Chatbot 🧪
          </h1>
          <p className="text-center text-green-200 mt-2">
            Talk to the smartest man in the multiverse! *burp*
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col">
        {/* Chat Container */}
        <div className="flex-1 bg-black bg-opacity-30 backdrop-blur-sm rounded-lg border border-green-400 shadow-2xl mb-4 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !isPlayingAudio && (
              <div className="text-center text-green-300 mt-8">
                <p className="text-lg mb-2">Hey there, *burp* genius!</p>
                <p className="text-sm opacity-75">Ask Rick something scientific, philosophical, or just plain stupid...</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.timestamp}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-green-600 text-white border border-green-400'
                  }`}
                >
                  <p className="text-sm md:text-base">{message.content}</p>
                </div>
              </div>
            ))}
            
            {(isLoading || isPlayingAudio) && (
              <div className="flex justify-start">
                <div className="bg-green-600 bg-opacity-50 text-green-100 p-3 rounded-lg border border-green-400">
                  <p className="text-sm">
                    {isPlayingAudio ? 'Rick is speaking... 🎵' : 'Rick is thinking... *burp*'}
                  </p>
                  <div className="flex space-x-1 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-green-400 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Rick something..."
                className="flex-1 p-3 bg-black bg-opacity-50 border border-green-400 rounded-lg text-white placeholder-green-300 focus:outline-none focus:border-green-300 focus:ring-1 focus:ring-green-300"
                disabled={isLoading || isPlayingAudio || !memoryLoaded}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || isPlayingAudio || !inputMessage.trim() || !memoryLoaded}
                className="p-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={clearChat}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors duration-200"
          >
            <Trash2 size={16} />
            <span>Clear Chat</span>
          </button>
          
          {audioUrl && (
            <button
              onClick={replayAudio}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors duration-200"
            >
              <Volume2 size={16} />
              <span>Replay Audio</span>
            </button>
          )}
        </div>

        {/* Hidden Audio Element */}
        {audioUrl && (
          <audio
            ref={audioRef}
            className="hidden"
            preload="auto"
          />
        )}

        {/* Footer */}
        <div className="text-center mt-4 text-green-300 text-sm opacity-75">
          <p>🔬 Powered by interdimensional science and AI 🔬</p>
        </div>
      </div>
    </div>
  );
};

export default RickChatbot;