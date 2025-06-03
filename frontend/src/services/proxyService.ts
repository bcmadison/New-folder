import axios, { AxiosRequestConfig } from 'axios';


const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

export class ProxyService {
  private static instance: ProxyService;
  private readonly proxyUrl: string;

  private constructor() {
    this.proxyUrl = CORS_PROXY;
  }

  static getInstance(): ProxyService {
    if (!ProxyService.instance) {
      ProxyService.instance = new ProxyService();
    }
    return ProxyService.instance;
  }

  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    const proxyConfig = {
      ...config,
      url: `${this.proxyUrl}${config.url}`,
      headers: {
        ...config.headers,
        'Origin': 'https://stats.nba.com',
        'Referer': 'https://stats.nba.com/',
        'x-requested-with': 'XMLHttpRequest'
      }
    };

    try {
      const response = await axios(proxyConfig);
      return response.data;
    } catch (error) {
      console.error('Proxy request failed:', error);
      throw error;
    }
  }
} 