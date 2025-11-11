/**
 * Unit tests for Frontend API Service
 * Tests API interactions with mocked fetch
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { sendMessage, createSession, checkHealth } from '../../agent/frontend/src/services/api';

// Mock fetch globally
global.fetch = vi.fn();

describe('Frontend API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    test('should create session successfully', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await createSession('test-app', 'user-123', 'session-456');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/apps/test-app/users/user-123/sessions/session-456'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    test('should throw error on session creation failure', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        createSession('test-app', 'user-123', 'session-456')
      ).rejects.toThrow('Failed to create session');
    });
  });

  describe('sendMessage', () => {
    test('should send message and return response', async () => {
      const mockResponse = [
        {
          content: {
            role: 'model',
            parts: [{ text: 'Hello! How can I help you?' }],
          },
        },
      ];

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await sendMessage('Hello', 'session-123', 'user-456');

      expect(result).toEqual({
        response: 'Hello! How can I help you?',
        sessionId: 'session-123',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/run'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    test('should handle API error responses', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error occurred',
      } as Response);

      await expect(
        sendMessage('Hello', 'session-123', 'user-456')
      ).rejects.toThrow('API request failed');
    });

    test('should handle network errors', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(
        sendMessage('Hello', 'session-123', 'user-456')
      ).rejects.toThrow('Unable to connect to the server');
    });

    test('should throw error when no response received', async () => {
      const mockResponse = [
        {
          content: {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
        },
      ];

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      await expect(
        sendMessage('Hello', 'session-123', 'user-456')
      ).rejects.toThrow('No response received from agent');
    });

    test('should extract sessionId from response', async () => {
      const mockResponse = {
        sessionId: 'new-session-789',
        events: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Response text' }],
            },
          },
        ],
      };

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await sendMessage('Hello', 'session-123', 'user-456');

      expect(result.sessionId).toBe('new-session-789');
    });
  });

  describe('checkHealth', () => {
    test('should return true when API is healthy', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const result = await checkHealth();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    test('should return false when API is unhealthy', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);

      const result = await checkHealth();

      expect(result).toBe(false);
    });

    test('should return false on network error', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkHealth();

      expect(result).toBe(false);
    });
  });
});

