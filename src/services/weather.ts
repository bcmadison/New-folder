import { apiService } from './api';

interface WeatherConfig {
  apiKey: string;
  baseUrl: string;
}

interface WeatherData {
  location: {
    city: string;
    state: string;
    country: string;
    coordinates: {
      lat: number;
      lon: number;
    };
  };
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    conditions: string;
    precipitation: number;
    visibility: number;
    pressure: number;
  };
  forecast: {
    timestamp: string;
    temperature: number;
    conditions: string;
    windSpeed: number;
    precipitation: number;
  }[];
  alerts: {
    type: string;
    severity: string;
    description: string;
    startTime: string;
    endTime: string;
  }[];
}

class WeatherService {
  private config: WeatherConfig;

  constructor() {
    this.config = {
      apiKey: process.env.REACT_APP_WEATHER_API_KEY || '',
      baseUrl: process.env.REACT_APP_WEATHER_API_URL || 'https://api.weatherapi.com',
    };
  }

  async getWeather(location: string, options?: {
    days?: number;
    includeAlerts?: boolean;
  }): Promise<WeatherData> {
    try {
      const params: any = {
        apiKey: this.config.apiKey,
        location,
        ...options,
      };

      const response = await apiService.get<WeatherData>(
        '/weather/forecast',
        params
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      throw error;
    }
  }

  async getHistoricalWeather(location: string, date: string): Promise<WeatherData> {
    try {
      const response = await apiService.get<WeatherData>(
        '/weather/historical',
        {
          apiKey: this.config.apiKey,
          location,
          date,
        }
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch historical weather:', error);
      throw error;
    }
  }

  async getWeatherAlerts(location: string): Promise<WeatherData['alerts']> {
    try {
      const response = await apiService.get<WeatherData['alerts']>(
        '/weather/alerts',
        {
          apiKey: this.config.apiKey,
          location,
        }
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch weather alerts:', error);
      throw error;
    }
  }

  async getWeatherImpact(eventId: string): Promise<{
    impact: number;
    factors: {
      temperature: number;
      wind: number;
      precipitation: number;
      visibility: number;
    };
  }> {
    try {
      const response = await apiService.get(
        `/weather/impact/${eventId}`,
        { apiKey: this.config.apiKey }
      );
      return response;
    } catch (error) {
      console.error('Failed to get weather impact:', error);
      throw error;
    }
  }
}

export const weatherService = new WeatherService(); 