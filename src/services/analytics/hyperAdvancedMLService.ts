import { apiClient } from '@/services/api/client'
import { webSocketService } from '@/services/websocket/webSocketService'
import { advancedMLService } from './advancedMLService'

interface DeepAnalysisMetrics {
  marketEfficiency: number
  bookmakerBias: number
  weatherImpact: number
  psychologicalFactors: number
  injuryImpact: number
  restDays: number
  travelDistance: number
  headToHeadHistory: number
  momentumScore: number
  publicBettingPercentage: number
}

interface MarketInefficiency {
  type: string
  confidence: number
  expectedValue: number
  arbitrageOpportunity: boolean
  hedgingStrategy?: {
    primaryBet: any
    hedgeBets: any[]
    guaranteedReturn: number
  }
}

interface AdvancedRiskMetrics {
  kellyStake: number
  optimalLeverage: number
  valueAtRisk: number
  expectedShortfall: number
  sharpeRatio: number
  informationRatio: number
}

class HyperAdvancedMLService {
  private deepLearningModels = [
    'transformerXL',
    'gpt3Fine',
    'bert',
    'deepEnsemble',
    'autoML'
  ]
  
  private marketAnalysis = {
    inefficiencyThreshold: 0.03,
    confidenceThreshold: 0.85,
    minExpectedValue: 1.15
  }

  private riskManagement = {
    maxKellyFraction: 0.25,
    maxDrawdown: 0.15,
    confidenceInterval: 0.95
  }

  constructor() {
    this.initializeHyperAdvancedSystem()
    this.setupMarketMonitoring()
  }

  private async initializeHyperAdvancedSystem() {
    try {
      await apiClient.post('/ml/hyper/initialize', {
        models: this.deepLearningModels,
        analysis: this.marketAnalysis,
        risk: this.riskManagement
      })
      this.startContinuousLearning()
    } catch (error) {
      console.error('Failed to initialize hyper-advanced system:', error)
    }
  }

  private setupMarketMonitoring() {
    webSocketService.subscribe('market_inefficiency', (data) => {
      this.analyzeMarketInefficiency(data)
    })

    webSocketService.subscribe('odds_movement', (data) => {
      this.detectValueOpportunities(data)
    })

    webSocketService.subscribe('sharp_money', (data) => {
      this.trackSharpBetting(data)
    })
  }

  private startContinuousLearning() {
    setInterval(() => {
      this.updateMarketKnowledge()
    }, 5 * 60 * 1000) // Every 5 minutes
  }

  private async analyzeMarketInefficiency(data: any) {
    try {
      await apiClient.post('/ml/hyper/market-analysis', {
        data,
        threshold: this.marketAnalysis.inefficiencyThreshold
      })
    } catch (error) {
      console.error('Market inefficiency analysis failed:', error)
    }
  }

  private async detectValueOpportunities(data: any) {
    try {
      await apiClient.post('/ml/hyper/value-detection', {
        data,
        minValue: this.marketAnalysis.minExpectedValue
      })
    } catch (error) {
      console.error('Value opportunity detection failed:', error)
    }
  }

  private async trackSharpBetting(data: any) {
    try {
      await apiClient.post('/ml/hyper/sharp-tracking', {
        data,
        confidence: this.marketAnalysis.confidenceThreshold
      })
    } catch (error) {
      console.error('Sharp money tracking failed:', error)
    }
  }

  private async updateMarketKnowledge() {
    try {
      await apiClient.post('/ml/hyper/market-update', {
        models: this.deepLearningModels,
        useTransfer: true,
        adaptiveRate: true
      })
    } catch (error) {
      console.error('Market knowledge update failed:', error)
    }
  }

  public async getDeepAnalysis(eventData: any): Promise<DeepAnalysisMetrics> {
    try {
      const response = await apiClient.post('/ml/hyper/deep-analysis', {
        event: eventData,
        models: this.deepLearningModels
      })
      return response.data
    } catch (error) {
      console.error('Deep analysis failed:', error)
      throw error
    }
  }

  public async findMarketInefficiencies(
    market: any
  ): Promise<MarketInefficiency[]> {
    try {
      const response = await apiClient.post('/ml/hyper/inefficiencies', {
        market,
        threshold: this.marketAnalysis.inefficiencyThreshold,
        confidence: this.marketAnalysis.confidenceThreshold
      })
      return response.data
    } catch (error) {
      console.error('Market inefficiency search failed:', error)
      throw error
    }
  }

  public async calculateOptimalStake(
    prediction: any,
    bankroll: number
  ): Promise<AdvancedRiskMetrics> {
    try {
      const response = await apiClient.post('/ml/hyper/risk-analysis', {
        prediction,
        bankroll,
        maxKelly: this.riskManagement.maxKellyFraction,
        maxDrawdown: this.riskManagement.maxDrawdown,
        confidence: this.riskManagement.confidenceInterval
      })
      return response.data
    } catch (error) {
      console.error('Optimal stake calculation failed:', error)
      throw error
    }
  }

  public async generateHedgingStrategies(bet: any): Promise<any> {
    try {
      const response = await apiClient.post('/ml/hyper/hedging', {
        bet,
        guaranteedReturn: true,
        multipleBooks: true
      })
      return response.data
    } catch (error) {
      console.error('Hedging strategy generation failed:', error)
      throw error
    }
  }

  public async getArbitrageOpportunities(): Promise<any> {
    try {
      const response = await apiClient.get('/ml/hyper/arbitrage')
      return response.data
    } catch (error) {
      console.error('Arbitrage opportunity search failed:', error)
      throw error
    }
  }
}

export const hyperAdvancedMLService = new HyperAdvancedMLService() 