// Message types
export interface Message {
  id: string;
  text: string;
  role: 'user' | 'agent';
  timestamp: number;
}

// Chat session interface
export interface ChatSession {
  sessionId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// Google ADK API types
export interface MessagePart {
  text: string;
}

export interface ADKMessage {
  parts: MessagePart[];
  role: 'user' | 'model';
}

export interface ADKRunRequest {
  app_name: string;
  user_id: string;
  session_id: string;
  new_message: ADKMessage;
  streaming: boolean;
}

export interface ADKEventContent {
  parts?: MessagePart[];
  role?: string;
}

export interface ADKEvent {
  type: string;
  content?: ADKEventContent;
  text?: string;
  parts?: MessagePart[];
}

export interface ADKRunResponse {
  events?: ADKEvent[];
  error?: string;
  message?: string;
  sessionId?: string;
  session_id?: string;
}

// Error types
export interface APIError {
  message: string;
  code?: string;
}

