import { StateCreator } from 'zustand';
import {
    DailyFantasyProjection, ESPNHeadline, OddsData, SocialSentimentData
} from '../../../../shared/prizePicks';
import { ActiveSubscription } from '../../../../shared/webSocket';
import { newsService } from '../../services/newsService';
import { sentimentService } from '../../services/sentimentService';
import { dataScrapingService } from '../../services/dataScrapingService';
import { AppStore } from '../useAppStore'; // Corrected path

export interface DynamicDataSlice {
    sentiments: Record<string, SocialSentimentData>; // Keyed by topic/player name
    headlines: ESPNHeadline[];
    dailyFantasyProjections: DailyFantasyProjection[];
    liveOdds: Record<string, OddsData>; // Keyed by propId or marketId
    activeSubscriptions: ActiveSubscription[];
    isLoadingSentiments: boolean;
    isLoadingHeadlines: boolean;
    isLoadingFantasyProjections: boolean;
    error: string | null; // Shared error for this slice
    fetchSentiments: (topic: string) => Promise<void>;
    fetchHeadlines: () => Promise<void>;
    fetchDailyFantasyProjections: (date: string, league?: string) => Promise<void>;
    updateLiveOdd: (odd: OddsData) => void; // For WebSocket updates
    addSubscription: (subscription: ActiveSubscription) => void;
    removeSubscription: (feedName: string) => void;
}

export const initialDynamicDataState: Pick<DynamicDataSlice, 'sentiments' | 'headlines' | 'dailyFantasyProjections' | 'liveOdds' | 'activeSubscriptions' | 'isLoadingSentiments' | 'isLoadingHeadlines' | 'isLoadingFantasyProjections' | 'error'> = {
    sentiments: {},
    headlines: [],
    dailyFantasyProjections: [],
    liveOdds: {},
    activeSubscriptions: [],
    isLoadingSentiments: false,
    isLoadingHeadlines: false,
    isLoadingFantasyProjections: false,
    error: null,
};

export const createDynamicDataSlice: StateCreator<
    AppStore,
    [],
    [],
    DynamicDataSlice
> = (set, get) => ({
    ...initialDynamicDataState,
    fetchSentiments: async (topic) => {
        set({ isLoadingSentiments: true, error: null });
        try {
            const sentimentData = await sentimentService.fetchSocialSentiment(topic);
            set((state) => ({ 
                sentiments: { ...state.sentiments, [topic.toLowerCase()]: sentimentData }, 
                isLoadingSentiments: false 
            }));
        } catch (e: any) {
            const errorMsg = e.message || 'Failed to fetch sentiments';
            set({ error: errorMsg, isLoadingSentiments: false });
            get().addToast({message: `Error fetching sentiment for ${topic}: ${errorMsg}`, type: 'error'});
        }
    },
    fetchHeadlines: async () => {
        set({ isLoadingHeadlines: true, error: null });
        try {
            const headlines = await newsService.fetchHeadlines(); // Default source 'espn'
            set({ headlines, isLoadingHeadlines: false });
        } catch (e: any) {
            const errorMsg = e.message || 'Failed to fetch headlines';
            set({ error: errorMsg, isLoadingHeadlines: false });
            get().addToast({message: `Error fetching headlines: ${errorMsg}`, type: 'error'});
        }
    },
    fetchDailyFantasyProjections: async (date, league) => {
        set({ isLoadingFantasyProjections: true, error: null });
        try {
            const projections = await dataScrapingService.fetchDailyFantasyProjections(date, league);
            set({ dailyFantasyProjections: projections, isLoadingFantasyProjections: false });
        } catch (e: any) {
            const errorMsg = e.message || 'Failed to fetch fantasy projections';
            set({ error: errorMsg, isLoadingFantasyProjections: false });
            get().addToast({message: `Error fetching Daily Fantasy Projections: ${errorMsg}`, type: 'error'});
        }
    },
    updateLiveOdd: (odd) => {
        set((state) => ({ 
            liveOdds: { ...state.liveOdds, [odd.propId]: odd }
        }));
        // Optionally, add a toast or log this update
        // get().addToast({ message: `Live odds updated for prop ${odd.propId}`, type: 'info' });
    },
    addSubscription: (subscription) => {
        set((state) => ({
            activeSubscriptions: [...state.activeSubscriptions.filter(s => s.feedName !== subscription.feedName), subscription]
        }));
    },
    removeSubscription: (feedName) => {
        set((state) => ({ 
            activeSubscriptions: state.activeSubscriptions.filter(s => s.feedName !== feedName)
        }));
    },
}); 