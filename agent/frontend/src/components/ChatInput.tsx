import { useState, type KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  isLoading: boolean;
}

export function ChatInput({ onSend, disabled, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !disabled) {
      onSend(trimmedInput);
      setInput('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-white/20 bg-white/10 backdrop-blur-md p-4">
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about earthquakes... (e.g., 'Show recent quakes near Kathmandu')"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-white/10 text-white rounded-xl px-4 py-3 
                     border border-white/30 focus:border-white/60 focus:outline-none 
                     focus:ring-2 focus:ring-white/30 resize-none backdrop-blur-sm
                     disabled:opacity-50 disabled:cursor-not-allowed
                     placeholder-white/50 text-sm md:text-base"
          style={{
            minHeight: '44px',
            maxHeight: '120px',
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="bg-white/20 text-white 
                     px-6 py-3 rounded-xl font-semibold
                     hover:bg-white/30
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center gap-2
                     backdrop-blur-sm"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="hidden sm:inline">Sending...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span className="hidden sm:inline">Send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

