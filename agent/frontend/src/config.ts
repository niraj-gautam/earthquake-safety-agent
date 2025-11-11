// Configuration settings
export const config = {
  // In development, use the Vite proxy. In production, use the full URL
  apiBaseUrl: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:8000'),
  appName: 'earthquake_agent',
  storageKey: 'earthquake-chat-session',
} as const;

