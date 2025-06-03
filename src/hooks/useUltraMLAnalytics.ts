import { useState, useEffect } from 'react'
import { ultraMLService } from '@/services/analytics/ultraMLService'
import { hyperAdvancedMLService } from '@/services/analytics/hyperAdvancedMLService'

interface UseUltraMLAnalyticsOptions {
  autoUpdate?: boolean
  updateInterval?: number
  riskTolerance?: number
  bankroll?: number
  blackSwanProtection?: boolean
  quantumOptimization?: boolean
}

export const useUltraMLAnalytics = (options: UseUltraMLAnalyticsOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantumPredictions, setQuantumPredictions] = useState<any[]>([])
  const [marketPsychology, setMarketPsychology] = useState<any>(null)
  const [ultraRiskMetrics, setUltraRiskMetrics] = useState<any>(null)
  const [blackSwanProtection, setBlackSwanProtection] = useState<any>(null)
  const [manipulationAlerts, setManipulationAlerts] = useState<any[]>([])

  useEffect(() => {
    if (options.autoUpdate) {
      const interval = setInterval(() => {
        updateUltraInsights()
      }, options.updateInterval || 1000) // Default 1 second for quantum speed
      return () => clearInterval(interval)
    }
  }, [options.autoUpdate, options.updateInterval])

  const updateUltraInsights = async () => {
    try {
      const [manipulation, psychology] = await Promise.all([
        detectMarketManipulation(),
        getMarketPsychology()
      ])
      setManipulationAlerts(manipulation)
      setMarketPsychology(psychology)
    } catch (err) {
      console.error('Failed to update ultra insights:', err)
    }
  }

  const getMarketPsychology = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const psychology = await ultraMLService.getMarketPsychology({
        riskTolerance: options.riskTolerance || 0.5
      })
      return psychology
    } catch (err) {
      setError('Failed to get market psychology')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getQuantumPrediction = async (eventData: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const prediction = await ultraMLService.getQuantumPrediction(eventData)
      return prediction
    } catch (err) {
      setError('Failed to get quantum prediction')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const calculateUltraRisk = async (prediction: any, psychology: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const risk = await ultraMLService.calculateUltraRisk(prediction, psychology)
      return risk
    } catch (err) {
      setError('Failed to calculate ultra risk')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const generateBlackSwanProtection = async (bet: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const protection = await ultraMLService.generateBlackSwanProtection(bet)
      return protection
    } catch (err) {
      setError('Failed to generate black swan protection')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const detectMarketManipulation = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const manipulation = await ultraMLService.detectMarketManipulation()
      return manipulation
    } catch (err) {
      setError('Failed to detect market manipulation')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const optimizeMultiverseOutcome = async (
    predictions: any[],
    psychology: any,
    risk: any
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const optimization = await ultraMLService.optimizeMultiverseOutcome(
        predictions,
        psychology,
        risk
      )
      return optimization
    } catch (err) {
      setError('Failed to optimize multiverse outcome')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeUltraBet = async (betData: any) => {
    setIsLoading(true)
    setError(null)
    try {
      // Get advanced analysis first
      const hyperAnalysis = await hyperAdvancedMLService.getDeepAnalysis(betData)

      // Get quantum-level insights
      const [
        psychology,
        quantumPred,
        manipulation,
        protection
      ] = await Promise.all([
        getMarketPsychology(),
        getQuantumPrediction(betData),
        detectMarketManipulation(),
        options.blackSwanProtection ? generateBlackSwanProtection(betData) : null
      ])

      // Calculate ultra risk metrics
      const ultraRisk = await calculateUltraRisk(quantumPred, psychology)

      // Optimize across multiple universes if enabled
      let multiverseOptimization = null
      if (options.quantumOptimization) {
        multiverseOptimization = await optimizeMultiverseOutcome(
          [quantumPred],
          psychology,
          ultraRisk
        )
      }

      // Combine all ultra-advanced insights
      const ultraBet = {
        ...betData,
        hyperAnalysis,
        psychology,
        quantumPrediction: quantumPred,
        ultraRisk,
        manipulation,
        blackSwanProtection: protection,
        multiverseOptimization,
        recommendation: {
          shouldBet:
            quantumPred.waveFunctionCollapse.certainty > 0.9 &&
            ultraRisk.psychologicalRiskScore < 0.3 &&
            !manipulation.some((m: any) => m.severity > 0.5),
          confidence: quantumPred.waveFunctionCollapse.certainty,
          stake: ultraRisk.quantumAdjustedKelly * (options.bankroll || 10000),
          expectedValue: quantumPred.superpositionStates.reduce(
            (acc: number, state: any) =>
              acc + state.probability * state.quantumConfidence,
            0
          ),
          protectionLevel: protection?.coverage || 0,
          manipulationRisk: ultraRisk.marketManipulationRisk
        }
      }

      setQuantumPredictions([ultraBet, ...quantumPredictions].slice(0, 5))
      setMarketPsychology(psychology)
      setUltraRiskMetrics(ultraRisk)
      setBlackSwanProtection(protection)
      setManipulationAlerts(manipulation)

      return ultraBet
    } catch (err) {
      setError('Failed to analyze ultra bet')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    analyzeUltraBet,
    getMarketPsychology,
    getQuantumPrediction,
    calculateUltraRisk,
    generateBlackSwanProtection,
    detectMarketManipulation,
    optimizeMultiverseOutcome,
    quantumPredictions,
    marketPsychology,
    ultraRiskMetrics,
    blackSwanProtection,
    manipulationAlerts,
    isLoading,
    error
  }
} 