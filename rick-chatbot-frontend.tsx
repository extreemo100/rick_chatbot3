import React, { useState, useRef, useEffect } from 'react';
import { Send, Volume2, RotateCcw, Trash2 } from 'lucide-react';

const RickChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputMessage, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Replace this URL with your actual backend API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].slice(-10) // Send last 10 messages for context
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
      
      setMessages(prev => [...prev, rickMessage]);
      
      // Handle audio if provided
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
        // Auto-play audio
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play().catch(e => console.log('Audio autoplay failed:', e));
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Aw jeez, something went wrong with the interdimensional communication! Try again, *burp*', 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setAudioUrl(null);
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
            {messages.length === 0 && (
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
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-green-600 bg-opacity-50 text-green-100 p-3 rounded-lg border border-green-400">
                  <p className="text-sm">Rick is thinking... *burp*</p>
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
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
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
            src={audioUrl}
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