import { useState, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import type { Message, ChatSession } from './types/chat';
import { sendMessage, createSession } from './services/api';
import { config } from './config';
import {
  loadSession,
  saveSession,
  clearSession,
  generateId,
  createNewSession,
  addMessageToSession,
} from './services/storage';

function App() {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId] = useState(() => generateId());

  // Initialize session on mount - create ADK session only for new chats
  useEffect(() => {
    async function initSession() {
      const savedSession = loadSession();
      let currentSession: ChatSession;
      let isNewSession = false;
      
      if (savedSession && savedSession.messages.length > 0) {
        // Existing session with messages - don't create new ADK session
        currentSession = savedSession;
        isNewSession = false;
      } else {
        // New session - need to create ADK session
        currentSession = createNewSession(generateId());
        saveSession(currentSession);
        isNewSession = true;
      }
      
      setSession(currentSession);
      
      // Create ADK session only for new chats
      if (isNewSession) {
        try {
          console.log('Creating new ADK session:', currentSession.sessionId);
          await createSession(config.appName, userId, currentSession.sessionId);
        } catch (err) {
          console.error('Failed to create ADK session:', err);
          // Continue anyway - will retry on first message
        }
      }
    }
    
    initSession();
  }, []); // Run once on mount

  const handleSendMessage = async (text: string) => {
    if (!session) return;

    setError(null);
    setIsLoading(true);

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      text,
      role: 'user',
      timestamp: Date.now(),
    };

    // Add user message to session
    const updatedSession = addMessageToSession(session, userMessage);
    setSession(updatedSession);
    saveSession(updatedSession);

    try {
      // Send message to API - always include sessionId (required by ADK)
      const result = await sendMessage(
        text,
        session.sessionId,
        userId
      );

      // Create agent message
      const agentMessage: Message = {
        id: generateId(),
        text: result.response,
        role: 'agent',
        timestamp: Date.now(),
      };

      // Add agent message and update session ID from server
      let finalSession = addMessageToSession(updatedSession, agentMessage);
      if (result.sessionId && result.sessionId !== session.sessionId) {
        finalSession = { ...finalSession, sessionId: result.sessionId };
      }
      setSession(finalSession);
      saveSession(finalSession);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);

      // Add error message to chat
      const errorAgentMessage: Message = {
        id: generateId(),
        text: `⚠️ **Error**: ${errorMessage}\n\nPlease try again or check if the agent server is running.`,
        role: 'agent',
        timestamp: Date.now(),
      };

      const errorSession = addMessageToSession(updatedSession, errorAgentMessage);
      setSession(errorSession);
      saveSession(errorSession);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      clearSession();
      const newSession = createNewSession(generateId());
      setSession(newSession);
      saveSession(newSession);
      setError(null);
      
      // Create new ADK session for the new chat
      try {
        console.log('Creating new ADK session for cleared chat:', newSession.sessionId);
        await createSession(config.appName, userId, newSession.sessionId);
      } catch (err) {
        console.error('Failed to create ADK session after clear:', err);
      }
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white">Q</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">QuakeGuide</h1>
              <p className="text-xs text-gray-400">
                Earthquake Alert & Safety Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-white">Ready</span>
            </div>
            <button
              onClick={handleClearChat}
              className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 
                         text-white rounded-lg transition-colors backdrop-blur-sm
                         border border-white/20"
              title="Clear chat history"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/20 backdrop-blur-md border-b border-red-400/30 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-white text-sm">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-white/80 hover:text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Chat Window */}
      <ChatWindow messages={session.messages} isLoading={isLoading} />

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
        isLoading={isLoading}
      />

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 px-4 py-2">
        <div className="max-w-4xl mx-auto text-center text-xs text-white/70">
          Powered by USGS Earthquake API • Data updated in real-time
        </div>
      </footer>
    </div>
  );
}

export default App;
