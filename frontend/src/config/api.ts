// API URL configuration
// In production (Docker), use relative path (proxied by nginx)
// In development, use localhost:3000
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

export const getApiUrl = (path: string) => {
  return `${API_URL}${path}`;
};
