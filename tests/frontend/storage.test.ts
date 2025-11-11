/**
 * Unit tests for Frontend Storage Service
 * Tests localStorage operations for chat sessions
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  saveSession,
  loadSession,
  clearSession,
  generateId,
  createNewSession,
  addMessageToSession,
} from '../../agent/frontend/src/services/storage';
import type { ChatSession, Message } from '../../agent/frontend/src/types/chat';

describe('Frontend Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateId', () => {
    test('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    test('should generate IDs in correct format', () => {
      const id = generateId();
      
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('createNewSession', () => {
    test('should create a new session with correct structure', () => {
      const sessionId = 'test-session-id';
      const session = createNewSession(sessionId);

      expect(session).toHaveProperty('sessionId', sessionId);
      expect(session).toHaveProperty('messages');
      expect(session.messages).toEqual([]);
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('updatedAt');
      expect(typeof session.createdAt).toBe('number');
      expect(typeof session.updatedAt).toBe('number');
    });
  });

  describe('saveSession and loadSession', () => {
    test('should save and load session correctly', () => {
      const session: ChatSession = {
        sessionId: 'test-session',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      saveSession(session);
      const loaded = loadSession();

      expect(loaded).toEqual(session);
    });

    test('should return null when no session exists', () => {
      const loaded = loadSession();
      expect(loaded).toBeNull();
    });

    test('should save session with messages', () => {
      const session: ChatSession = {
        sessionId: 'test-session',
        messages: [
          {
            id: 'msg-1',
            text: 'Hello',
            role: 'user',
            timestamp: Date.now(),
          },
          {
            id: 'msg-2',
            text: 'Hi there!',
            role: 'agent',
            timestamp: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      saveSession(session);
      const loaded = loadSession();

      expect(loaded).toEqual(session);
      expect(loaded?.messages).toHaveLength(2);
    });
  });

  describe('clearSession', () => {
    test('should clear session from storage', () => {
      const session = createNewSession('test-session');
      saveSession(session);

      // Verify it exists
      expect(loadSession()).not.toBeNull();

      clearSession();

      // Verify it's gone
      expect(loadSession()).toBeNull();
    });
  });

  describe('addMessageToSession', () => {
    test('should add message to session', () => {
      const session = createNewSession('test-session');
      const message: Message = {
        id: 'msg-1',
        text: 'Test message',
        role: 'user',
        timestamp: Date.now(),
      };

      const updatedSession = addMessageToSession(session, message);

      expect(updatedSession.messages).toHaveLength(1);
      expect(updatedSession.messages[0]).toEqual(message);
      expect(updatedSession.sessionId).toBe(session.sessionId);
    });

    test('should preserve existing messages when adding new one', () => {
      const message1: Message = {
        id: 'msg-1',
        text: 'First message',
        role: 'user',
        timestamp: Date.now(),
      };

      const message2: Message = {
        id: 'msg-2',
        text: 'Second message',
        role: 'agent',
        timestamp: Date.now(),
      };

      let session = createNewSession('test-session');
      session = addMessageToSession(session, message1);
      session = addMessageToSession(session, message2);

      expect(session.messages).toHaveLength(2);
      expect(session.messages[0]).toEqual(message1);
      expect(session.messages[1]).toEqual(message2);
    });

    test('should update timestamp when adding message', () => {
      const session = createNewSession('test-session');
      const originalUpdatedAt = session.updatedAt;

      // Wait a tiny bit to ensure timestamp changes
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      const message: Message = {
        id: 'msg-1',
        text: 'Test message',
        role: 'user',
        timestamp: Date.now(),
      };

      const updatedSession = addMessageToSession(session, message);

      expect(updatedSession.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);

      vi.useRealTimers();
    });

    test('should not mutate original session', () => {
      const session = createNewSession('test-session');
      const originalMessagesLength = session.messages.length;

      const message: Message = {
        id: 'msg-1',
        text: 'Test message',
        role: 'user',
        timestamp: Date.now(),
      };

      addMessageToSession(session, message);

      // Original session should not be modified
      expect(session.messages).toHaveLength(originalMessagesLength);
    });
  });
});

