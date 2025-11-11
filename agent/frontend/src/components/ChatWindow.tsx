import { useEffect, useRef } from 'react';
import type { Message } from '../types/chat';
import { ChatMessage } from './ChatMessage';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const exampleQueries = [
    '🌍 Show recent quakes near Kathmandu',
    '⚡ What\'s the latest significant quake globally?',
    '📊 Quakes over M4.5 in the last 7 days',
    '📍 How far was the last quake from Pokhara?',
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
              <span className="text-3xl font-bold text-white">Q</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              QuakeGuide Assistant
            </h2>
            <p className="text-white/80 mb-6 max-w-md text-lg">
              Get real-time earthquake information and safety guidance powered by USGS data
            </p>
            <div className="w-full max-w-lg">
              <p className="text-sm text-white/70 mb-3 font-medium">Try asking:</p>
              <div className="grid gap-2">
                {exampleQueries.map((query, index) => (
                  <div
                    key={index}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 
                               text-left text-sm text-white backdrop-blur-sm hover:bg-white/15 
                               transition-colors cursor-default"
                  >
                    {query}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/10 border border-white/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      Q
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                    </div>
                    <span className="text-white/80 text-sm">QuakeGuide is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

