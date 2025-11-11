import ReactMarkdown from 'react-markdown';
import type { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex w-full mb-4 message-animate ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-white/20 text-white backdrop-blur-sm'
            : 'bg-white/10 text-white border border-white/20 backdrop-blur-sm'
        }`}
      >
        <div className="flex items-start gap-2">
          {!isUser && (
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              Q
            </div>
          )}
          <div className="flex-1 min-w-0">
            {isUser ? (
              <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                {message.text}
              </p>
            ) : (
              <div className="prose prose-invert prose-sm md:prose-base max-w-none">
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-300 hover:text-pink-200 underline"
                      />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-2">
                        <table
                          {...props}
                          className="min-w-full border-collapse border border-white/30"
                        />
                      </div>
                    ),
                    th: ({ node, ...props }) => (
                      <th
                        {...props}
                        className="border border-white/30 px-3 py-2 bg-white/10 text-left font-semibold"
                      />
                    ),
                    td: ({ node, ...props }) => (
                      <td
                        {...props}
                        className="border border-white/30 px-3 py-2"
                      />
                    ),
                    code: ({ node, ...props }) => (
                      <code
                        {...props}
                        className="bg-white/10 px-1 py-0.5 rounded text-sm"
                      />
                    ),
                    pre: ({ node, ...props }) => (
                      <pre
                        {...props}
                        className="bg-white/10 p-3 rounded-lg overflow-x-auto my-2 backdrop-blur-sm"
                      />
                    ),
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
            )}
            <div
              className={`text-xs mt-1 ${
                isUser ? 'text-white/80' : 'text-white/60'
              }`}
            >
              {timestamp}
            </div>
          </div>
          {isUser && (
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-xs font-bold">
              U
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

