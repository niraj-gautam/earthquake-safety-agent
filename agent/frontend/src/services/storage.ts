import type { ChatSession, Message } from '../types/chat';
import { config } from '../config';

/**
 * Save chat session to localStorage
 */
export function saveSession(session: ChatSession): void {
  try {
    localStorage.setItem(config.storageKey, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save session to localStorage:', error);
  }
}

/**
 * Load chat session from localStorage
 */
export function loadSession(): ChatSession | null {
  try {
    const stored = localStorage.getItem(config.storageKey);
    if (!stored) return null;
    
    const session = JSON.parse(stored) as ChatSession;
    return session;
  } catch (error) {
    console.error('Failed to load session from localStorage:', error);
    return null;
  }
}

/**
 * Clear chat session from localStorage
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(config.storageKey);
  } catch (error) {
    console.error('Failed to clear session from localStorage:', error);
  }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new chat session
 */
export function createNewSession(sessionId: string): ChatSession {
  return {
    sessionId,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Add a message to session
 */
export function addMessageToSession(
  session: ChatSession,
  message: Message
): ChatSession {
  return {
    ...session,
    messages: [...session.messages, message],
    updatedAt: Date.now(),
  };
}

