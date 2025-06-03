import { get } from './api';
import { ESPNHeadline } from '../types';
import { unifiedMonitor } from '../core/UnifiedMonitor';
import { APIError, AppError } from '../core/UnifiedError';

const API_BASE_URL = import.meta.env.VITE_API_URL;
// Backend endpoint for news is /api/news/headlines
const NEWS_BACKEND_PREFIX = `${API_BASE_URL}/api/news`;

/**
 * Fetches news headlines from the backend.
 * The backend /api/news/headlines endpoint is currently mocked but is expected to return
 * an array of objects matching the ESPNHeadline interface.
 * Example response:
 * [
 *   {
 *     "id": "news123",
 *     "title": "Player X signs new contract",
 *     "summary": "Details about the new contract...",
 *     "link": "http://espn.com/news/story?id=news123",
 *     "publishedAt": "2023-10-27T10:00:00Z",
 *     "source": "ESPN Mock News",
 *     "imageUrl": "http://example.com/image.jpg",
 *     "category": "NBA"
 *   },
 *   ...
 * ]
 */
export const fetchHeadlines = async (source: string = 'espn', limit: number = 10): Promise<ESPNHeadline[]> => {
  const trace = unifiedMonitor.startTrace('newsService.fetchHeadlines', 'http.client');
  try {
    let endpoint = `${NEWS_BACKEND_PREFIX}/headlines`;
    const params = new URLSearchParams();
    if (source) params.append('source', source);
    if (limit) params.append('limit', limit.toString());
    if (params.toString()) endpoint += `?${params.toString()}`;

    const response = await get<ESPNHeadline[]>(endpoint);

    if (trace) {
      trace.setHttpStatus(response.status);
      unifiedMonitor.endTrace(trace);
    }
    return response.data || []; // Return empty array if data is null/undefined

  } catch (error: any) {
    const errContext = { service: 'newsService', operation: 'fetchHeadlines', source, limit };
    unifiedMonitor.reportError(error, errContext);
    if (trace) {
      trace.setHttpStatus(error.response?.status || 500);
      unifiedMonitor.endTrace(trace);
    }
    if (error instanceof APIError || error instanceof AppError) throw error;
    throw new AppError('Failed to fetch news headlines from backend.', undefined, errContext, error);
  }
};

export const newsService = {
  fetchHeadlines,
  // fetchArticleContent: async (articleId: string) => { /* ... */ }, // Future implementation
}; 