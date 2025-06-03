import { useState, useEffect } from 'react'
import { evolutionaryMLService } from '@/services/analytics/evolutionaryMLService'
import { ultraMLService } from '@/services/analytics/ultraMLService'

interface UseEvolutionaryAnalyticsOptions {
  autoUpdate?: boolean
  updateInterval?: number
  populationSize?: number
  generationLimit?: number
  competitorCount?: number
  simulationIterations?: number
}

export const useEvolutionaryAnalytics = (options: UseEvolutionaryAnalyticsOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gameTheoryAnalysis, setGameTheoryAnalysis] = useState<any>(null)
  const [evolutionaryMetrics, setEvolutionaryMetrics] = useState<any>(null)
  const [reinforcementMetrics, setReinforcementMetrics] = useState<any>(null)
  const [optimizedStrategies, setOptimizedStrategies] = useState<any[]>([])
  const [competitiveDynamics, setCompetitiveDynamics] = useState<any>(null)

  useEffect(() => {
    if (options.autoUpdate) {
      const interval = setInterval(() => {
        updateEvolutionaryInsights()
      }, options.updateInterval || 5000) // Default 5 seconds for evolutionary updates
      return () => clearInterval(interval)
    }
  }, [options.autoUpdate, options.updateInterval])

  const updateEvolutionaryInsights = async () => {
    try {
      const [gameTheory, evolution] = await Promise.all([
        getGameTheoryAnalysis(),
        getEvolutionaryMetrics()
      ])
      setGameTheoryAnalysis(gameTheory)
      setEvolutionaryMetrics(evolution)
    } catch (err) {
      console.error('Failed to update evolutionary insights:', err)
    }
  }

  const getGameTheoryAnalysis = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const competitors = Array.from({ length: options.competitorCount || 5 }, (_, i) => ({
        id: i,
        strategy: `Competitor ${i + 1}`,
        strength: Math.random()
      }))
      const analysis = await evolutionaryMLService.getGameTheoryAnalysis(
        { timestamp: Date.now() },
        competitors
      )
      return analysis
    } catch (err) {
      setError('Failed to get game theory analysis')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getEvolutionaryMetrics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const metrics = await evolutionaryMLService.getEvolutionaryMetrics({
        populationSize: options.populationSize || 1000,
        generationLimit: options.generationLimit || 100
      })
      return metrics
    } catch (err) {
      setError('Failed to get evolutionary metrics')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getReinforcementMetrics = async (state: any, action: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const metrics = await evolutionaryMLService.getReinforcementMetrics(
        state,
        action
      )
      setReinforcementMetrics(metrics)
      return metrics
    } catch (err) {
      setError('Failed to get reinforcement metrics')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const optimizeStrategy = async (strategy: any, marketConditions: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const optimized = await evolutionaryMLService.optimizeStrategy(
        strategy,
        marketConditions
      )
      setOptimizedStrategies([optimized, ...optimizedStrategies].slice(0, 5))
      return optimized
    } catch (err) {
      setError('Failed to optimize strategy')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const simulateCompetitiveDynamics = async (
    strategies: any[],
    marketConditions: any
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const simulation = await evolutionaryMLService.simulateCompetitiveDynamics(
        strategies,
        marketConditions,
        options.simulationIterations || 1000
      )
      setCompetitiveDynamics(simulation)
      return simulation
    } catch (err) {
      setError('Failed to simulate competitive dynamics')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeEvolutionaryBet = async (betData: any) => {
    setIsLoading(true)
    setError(null)
    try {
      // Get quantum predictions first
      const quantumPred = await ultraMLService.getQuantumPrediction(betData)

      // Get evolutionary insights
      const [
        gameTheory,
        evolution,
        reinforcement
      ] = await Promise.all([
        getGameTheoryAnalysis(),
        getEvolutionaryMetrics(),
        getReinforcementMetrics(betData, betData.action)
      ])

      // Optimize strategy based on all insights
      const optimizedStrategy = await optimizeStrategy(
        {
          ...betData,
          competitors: gameTheory.nashEquilibrium.map((eq: any) => ({
            strategy: eq.strategy,
            payoff: eq.payoff
          }))
        },
        {
          quantum: quantumPred,
          gameTheory,
          evolution
        }
      )

      // Simulate competitive dynamics
      const simulation = await simulateCompetitiveDynamics(
        [optimizedStrategy, ...gameTheory.nashEquilibrium],
        {
          quantum: quantumPred,
          evolution: evolution.fitnessLandscape
        }
      )

      // Combine all evolutionary insights
      const evolutionaryBet = {
        ...betData,
        quantumPrediction: quantumPred,
        gameTheory,
        evolution,
        reinforcement,
        optimizedStrategy,
        competitiveDynamics: simulation,
        recommendation: {
          shouldBet:
            optimizedStrategy.fitness > 0.7 &&
            simulation.stability > 0.6 &&
            gameTheory.nashEquilibrium.some(
              (eq: any) => eq.stability > 0.8
            ),
          confidence: Math.min(
            optimizedStrategy.fitness,
            simulation.stability,
            Math.max(...gameTheory.nashEquilibrium.map((eq: any) => eq.stability))
          ),
          stake: optimizedStrategy.recommendedStake,
          expectedValue: optimizedStrategy.expectedPayoff,
          competitiveAdvantage: simulation.relativeAdvantage,
          evolutionaryStability: evolution.populationDynamics.stabilityMetrics[0]
        }
      }

      setGameTheoryAnalysis(gameTheory)
      setEvolutionaryMetrics(evolution)
      setReinforcementMetrics(reinforcement)
      setOptimizedStrategies([optimizedStrategy, ...optimizedStrategies].slice(0, 5))
      setCompetitiveDynamics(simulation)

      return evolutionaryBet
    } catch (err) {
      setError('Failed to analyze evolutionary bet')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    analyzeEvolutionaryBet,
    getGameTheoryAnalysis,
    getEvolutionaryMetrics,
    getReinforcementMetrics,
    optimizeStrategy,
    simulateCompetitiveDynamics,
    gameTheoryAnalysis,
    evolutionaryMetrics,
    reinforcementMetrics,
    optimizedStrategies,
    competitiveDynamics,
    isLoading,
    error
  }
} 