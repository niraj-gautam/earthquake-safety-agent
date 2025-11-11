import { config } from '../config';
import type {
  ADKRunResponse,
} from '../types/chat';

/**
 * Create a new session
 */
export async function createSession(
  appName: string,
  userId: string,
  sessionId: string
): Promise<void> {
  try {
    await fetch(
      `${config.apiBaseUrl}/apps/${appName}/users/${userId}/sessions/${sessionId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Empty initial state
      }
    );
  } catch (error) {
    console.error('Session creation failed:', error);
    throw new Error('Failed to create session');
  }
}

/**
 * Send a message to the Google ADK agent
 * Returns both the response text and the session ID from the server
 */
export async function sendMessage(
  message: string,
  sessionId: string,
  userId: string
): Promise<{ response: string; sessionId: string }> {
  try {

      const requestBody = {
      app_name: config.appName,
      session_id: sessionId, 
      user_id: userId,
      new_message: {
        parts: [{ text: message }],
        role: 'user',
      },
      streaming: false,
    };

    const response = await fetch(`${config.apiBaseUrl}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const data = (await response.json()) as ADKRunResponse;

    // Extract the agent's response from the events
    const agentResponse = extractAgentResponse(data);

    if (!agentResponse) {
      throw new Error('No response received from agent');
    }

    // Extract session ID from response (try both camelCase and snake_case)
    const serverSessionId = data.sessionId || data.session_id || sessionId || '';

    return {
      response: agentResponse,
      sessionId: serverSessionId,
    };
  } catch (error) {
    console.error('Error sending message:', error);
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Failed to fetch')) {
        throw new Error(
          'Unable to connect to the server. Please check if the agent is running.'
        );
      }
      throw error;
    }
    
    throw new Error('An unexpected error occurred while sending the message');
  }
}

/**
 * Extract the agent's response text from ADK response events
 */
function extractAgentResponse(response: any): string | null {
  // ADK API returns an array of events directly
  let events: any[] = [];
  
  if (Array.isArray(response)) {
    // Response is directly an array of events
    events = response;
  } else if (response.events && Array.isArray(response.events)) {
    // Response has an events property
    events = response.events;
  }

  if (events.length === 0) {
    return null;
  }

  // Look for the agent's message in the events
  // Check each event for content with role "model" (agent response)
  for (const event of events) {
    // Check if event has content with parts (ADK format)
    if (event.content?.parts && event.content.parts.length > 0) {
      // Only extract text from model/agent responses
      if (event.content.role === 'model' || event.author?.includes('agent')) {
        const text = event.content.parts
          .map((part: any) => part.text)
          .filter(Boolean)
          .join('');
        if (text) return text;
      }
    }

    // Check if event has parts directly
    if (event.parts && event.parts.length > 0) {
      const text = event.parts
        .map((part: any) => part.text)
        .filter(Boolean)
        .join('');
      if (text) return text;
    }

    // Check if event has text directly
    if (event.text) {
      return event.text;
    }
  }

  // If we didn't find a response, try to get the last event with model content
  const lastModelEvent = events
    .reverse()
    .find((e) => e.content?.role === 'model' || e.author?.includes('agent'));
  
  if (lastModelEvent?.content?.parts) {
    return lastModelEvent.content.parts
      .map((part: any) => part.text)
      .filter(Boolean)
      .join('');
  }

  return null;
}

/**
 * Check API health status
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

