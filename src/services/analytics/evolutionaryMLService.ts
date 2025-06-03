import { apiClient } from '@/services/api/client'
import { webSocketService } from '@/services/websocket/webSocketService'
import { ultraMLService } from './ultraMLService'

interface GameTheoryAnalysis {
  nashEquilibrium: {
    strategy: string
    payoff: number
    stability: number
  }[]
  paretoOptimal: {
    strategy: string
    payoff: number
    efficiency: number
  }[]
  strategicDominance: {
    dominant: string[]
    dominated: string[]
    mixed: string[]
  }
  coalitionFormation: {
    optimalCoalitions: string[][]
    stabilityScores: number[]
    payoffDistribution: number[]
  }
}

interface EvolutionaryMetrics {
  fitnessLandscape: {
    peaks: { strategy: string; fitness: number }[]
    valleys: { strategy: string; fitness: number }[]
    gradients: { from: string; to: string; slope: number }[]
  }
  adaptiveWalk: {
    path: string[]
    fitnessTrajectory: number[]
    convergenceRate: number
  }
  populationDynamics: {
    dominantStrategies: string[]
    extinctStrategies: string[]
    coexistingStrategies: string[]
    stabilityMetrics: number[]
  }
}

interface ReinforcementMetrics {
  qValues: Record<string, Record<string, number>>
  policyGradients: Record<string, number>
  advantageEstimates: Record<string, number>
  valueBaselines: Record<string, number>
  entropyRegularization: number
  explorationRate: number
}

class EvolutionaryMLService {
  private gameTheoryModels = [
    'nashSolver',
    'paretoOptimizer',
    'coalitionFormer',
    'equilibriumFinder'
  ]

  private evolutionaryParams = {
    populationSize: 1000,
    generationLimit: 100,
    mutationRate: 0.01,
    crossoverRate: 0.7,
    selectionPressure: 0.8
  }

  private reinforcementConfig = {
    learningRate: 0.001,
    discountFactor: 0.99,
    explorationDecay: 0.995,
    minExploration: 0.01,
    batchSize: 64,
    replayBufferSize: 10000
  }

  constructor() {
    this.initializeEvolutionarySystem()
    this.setupAdvancedMonitoring()
  }

  private async initializeEvolutionarySystem() {
    try {
      await apiClient.post('/ml/evolutionary/initialize', {
        gameTheory: this.gameTheoryModels,
        evolution: this.evolutionaryParams,
        reinforcement: this.reinforcementConfig
      })
      this.startEvolutionaryProcessing()
    } catch (error) {
      console.error('Failed to initialize evolutionary system:', error)
    }
  }

  private setupAdvancedMonitoring() {
    webSocketService.subscribe('strategy_evolution', (data) => {
      this.analyzeStrategyEvolution(data)
    })

    webSocketService.subscribe('nash_equilibrium', (data) => {
      this.updateGameTheory(data)
    })

    webSocketService.subscribe('reinforcement_signal', (data) => {
      this.processReinforcementSignal(data)
    })
  }

  private startEvolutionaryProcessing() {
    setInterval(() => {
      this.evolveStrategies()
    }, 5000) // Every 5 seconds for evolutionary updates
  }

  private async analyzeStrategyEvolution(data: any) {
    try {
      await apiClient.post('/ml/evolutionary/analyze', {
        data,
        params: this.evolutionaryParams
      })
    } catch (error) {
      console.error('Strategy evolution analysis failed:', error)
    }
  }

  private async updateGameTheory(data: any) {
    try {
      await apiClient.post('/ml/evolutionary/game-theory', {
        data,
        models: this.gameTheoryModels
      })
    } catch (error) {
      console.error('Game theory update failed:', error)
    }
  }

  private async processReinforcementSignal(data: any) {
    try {
      await apiClient.post('/ml/evolutionary/reinforce', {
        data,
        config: this.reinforcementConfig
      })
    } catch (error) {
      console.error('Reinforcement signal processing failed:', error)
    }
  }

  private async evolveStrategies() {
    try {
      await apiClient.post('/ml/evolutionary/evolve', {
        params: this.evolutionaryParams,
        generation: Date.now()
      })
    } catch (error) {
      console.error('Strategy evolution failed:', error)
    }
  }

  public async getGameTheoryAnalysis(
    market: any,
    competitors: any[]
  ): Promise<GameTheoryAnalysis> {
    try {
      const response = await apiClient.post('/ml/evolutionary/game-analysis', {
        market,
        competitors,
        models: this.gameTheoryModels
      })
      return response.data
    } catch (error) {
      console.error('Game theory analysis failed:', error)
      throw error
    }
  }

  public async getEvolutionaryMetrics(
    strategy: any
  ): Promise<EvolutionaryMetrics> {
    try {
      const response = await apiClient.post('/ml/evolutionary/metrics', {
        strategy,
        params: this.evolutionaryParams
      })
      return response.data
    } catch (error) {
      console.error('Evolutionary metrics calculation failed:', error)
      throw error
    }
  }

  public async getReinforcementMetrics(
    state: any,
    action: any
  ): Promise<ReinforcementMetrics> {
    try {
      const response = await apiClient.post('/ml/evolutionary/reinforcement', {
        state,
        action,
        config: this.reinforcementConfig
      })
      return response.data
    } catch (error) {
      console.error('Reinforcement metrics calculation failed:', error)
      throw error
    }
  }

  public async optimizeStrategy(
    currentStrategy: any,
    marketConditions: any
  ): Promise<any> {
    try {
      // Get quantum predictions from ultra service
      const quantumPred = await ultraMLService.getQuantumPrediction(marketConditions)

      // Get game theory analysis
      const gameTheory = await this.getGameTheoryAnalysis(
        marketConditions,
        currentStrategy.competitors
      )

      // Get evolutionary metrics
      const evolution = await this.getEvolutionaryMetrics(currentStrategy)

      // Get reinforcement metrics
      const reinforcement = await this.getReinforcementMetrics(
        marketConditions,
        currentStrategy.action
      )

      // Combine all insights for strategy optimization
      const response = await apiClient.post('/ml/evolutionary/optimize', {
        strategy: currentStrategy,
        quantum: quantumPred,
        gameTheory,
        evolution,
        reinforcement,
        params: {
          evolution: this.evolutionaryParams,
          reinforcement: this.reinforcementConfig
        }
      })

      return response.data
    } catch (error) {
      console.error('Strategy optimization failed:', error)
      throw error
    }
  }

  public async simulateCompetitiveDynamics(
    strategies: any[],
    marketConditions: any,
    iterations: number
  ): Promise<any> {
    try {
      const response = await apiClient.post('/ml/evolutionary/simulate', {
        strategies,
        market: marketConditions,
        iterations,
        params: {
          evolution: this.evolutionaryParams,
          gameTheory: this.gameTheoryModels,
          reinforcement: this.reinforcementConfig
        }
      })
      return response.data
    } catch (error) {
      console.error('Competitive dynamics simulation failed:', error)
      throw error
    }
  }
}

export const evolutionaryMLService = new EvolutionaryMLService() 