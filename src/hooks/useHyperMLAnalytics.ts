import { useState, useEffect } from 'react'
import { hyperAdvancedMLService } from '@/services/analytics/hyperAdvancedMLService'

interface UseHyperMLAnalyticsOptions {
  autoUpdate?: boolean
  updateInterval?: number
  riskTolerance?: number
  bankroll?: number
}

export const useHyperMLAnalytics = (options: UseHyperMLAnalyticsOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [optimalBets, setOptimalBets] = useState<any[]>([])
  const [marketInsights, setMarketInsights] = useState<any>(null)

  useEffect(() => {
    if (options.autoUpdate) {
      const interval = setInterval(() => {
        updateMarketInsights()
      }, options.updateInterval || 60000) // Default 1 minute
      return () => clearInterval(interval)
    }
  }, [options.autoUpdate, options.updateInterval])

  const updateMarketInsights = async () => {
    try {
      const inefficiencies = await findMarketInefficiencies()
      const arbitrage = await findArbitrageOpportunities()
      setMarketInsights({ inefficiencies, arbitrage })
    } catch (err) {
      console.error('Failed to update market insights:', err)
    }
  }

  const getDeepAnalysis = async (eventData: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const analysis = await hyperAdvancedMLService.getDeepAnalysis(eventData)
      return analysis
    } catch (err) {
      setError('Failed to get deep analysis')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const findMarketInefficiencies = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const inefficiencies = await hyperAdvancedMLService.findMarketInefficiencies({
        riskTolerance: options.riskTolerance || 0.5
      })
      return inefficiencies
    } catch (err) {
      setError('Failed to find market inefficiencies')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const calculateOptimalStake = async (prediction: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const riskMetrics = await hyperAdvancedMLService.calculateOptimalStake(
        prediction,
        options.bankroll || 10000
      )
      return riskMetrics
    } catch (err) {
      setError('Failed to calculate optimal stake')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const generateHedgingStrategies = async (bet: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const strategies = await hyperAdvancedMLService.generateHedgingStrategies(bet)
      return strategies
    } catch (err) {
      setError('Failed to generate hedging strategies')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const findArbitrageOpportunities = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const opportunities = await hyperAdvancedMLService.getArbitrageOpportunities()
      return opportunities
    } catch (err) {
      setError('Failed to find arbitrage opportunities')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeBet = async (betData: any) => {
    setIsLoading(true)
    setError(null)
    try {
      // Comprehensive bet analysis
      const [
        deepAnalysis,
        inefficiencies,
        riskMetrics,
        hedgingStrategies,
        arbitrage
      ] = await Promise.all([
        getDeepAnalysis(betData),
        findMarketInefficiencies(),
        calculateOptimalStake(betData),
        generateHedgingStrategies(betData),
        findArbitrageOpportunities()
      ])

      // Calculate optimal bet based on all factors
      const optimalBet = {
        ...betData,
        analysis: deepAnalysis,
        marketInefficiencies: inefficiencies,
        riskMetrics,
        hedgingStrategies,
        arbitrageOpportunities: arbitrage,
        recommendation: {
          shouldBet: deepAnalysis.marketEfficiency > 0.7 && riskMetrics.sharpeRatio > 1.5,
          confidence: deepAnalysis.momentumScore * riskMetrics.informationRatio,
          stake: riskMetrics.kellyStake,
          expectedValue: inefficiencies[0]?.expectedValue || 0
        }
      }

      setOptimalBets([optimalBet, ...optimalBets].slice(0, 10))
      return optimalBet
    } catch (err) {
      setError('Failed to analyze bet')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    analyzeBet,
    getDeepAnalysis,
    findMarketInefficiencies,
    calculateOptimalStake,
    generateHedgingStrategies,
    findArbitrageOpportunities,
    optimalBets,
    marketInsights,
    isLoading,
    error
  }
} 