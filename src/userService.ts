import { PrizePicksEntry } from '../types';
import { unifiedMonitor } from '../core/UnifiedMonitor';

// src/services/userService.ts

export const userService = {
  fetchUserEntries: async (userId: string): Promise<PrizePicksEntry[]> => {
    const trace = unifiedMonitor.startTrace('userService.fetchUserEntries', 'data.fetch', `UserID: ${userId}`);
    try {
      // Dynamically import getApiClient to avoid early UnifiedConfig access
      const { default: getApiClient } = await import('./api');
      if (import.meta.env.VITE_API_URL) {
        // This would call the backend endpoint to get entries for a user
        const response = await getApiClient().get<PrizePicksEntry[]>(`/users/${userId}/entries`);
        unifiedMonitor.endTrace(trace);
        return response.data;
      }
      
      console.warn(`userService.fetchUserEntries for ${userId} called: VITE_API_URL not set. Using mock data.`);
      // Returning empty array for mock as entries are specific and complex to mock meaningfully here
      return new Promise(resolve => setTimeout(() => {
        resolve([]); 
        if(trace) unifiedMonitor.endTrace(trace);
      }, 300));
      
    } catch (error: any) {
      unifiedMonitor.reportError(error, { operation: 'userService.fetchUserEntries', userId });
      if(trace) unifiedMonitor.endTrace(trace);
      throw error;
    }
  },
  // fetchUserProfile: async (userId: string): Promise<User> => { ... }
  // updateUserPreferences: async (userId: string, preferences: UserPreferences): Promise<User> => { ... }
}; 