
export const config = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://api.your-production-domain.com',
  wsEndpoint: import.meta.env.VITE_WS_URL || 'wss://ws.your-production-domain.com',
}; 