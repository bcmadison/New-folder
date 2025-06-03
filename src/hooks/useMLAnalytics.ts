import { useState, useEffect, useCallback } from 'react'
import { predictionOptimizationService } from '@/services/analytics/predictionOptimizationService'
import { mlService } from '@/services/analytics/mlService'
import { advancedMLService } from '@/services/analytics/advancedMLService'
import { timeSeriesService } from '@/services/analytics/timeSeriesService'
import { clusteringService } from '@/services/analytics/clusteringService'
import { featureEngineeringService } from '@/services/analytics/featureEngineeringService'
import { riskModelingService } from '@/services/analytics/riskModelingService'

interface UseMLAnalyticsOptions {
  autoUpdate?: boolean
  updateInterval?: number
}

interface MLAnalyticsConfig {
  modelType: string
  params: Record<string, any>
  features: any[]
  target?: any[]
}

interface MLAnalyticsResult {
  predictions: number[]
  probabilities: number[]
  metrics: {
    accuracy: number
    precision: number
    recall: number
    f1Score: number
  }
  insights: {
    featureImportance: Record<string, number>
    shap: Record<string, number[]>
    lime: Record<string, number>
  }
}

interface RiskAnalyticsResult {
  riskMetrics: Record<string, number>
  recommendations: {
    shouldBet: boolean
    confidence: number
    maxStake: number
    expectedValue: number
  }
  simulation: {
    distribution: number[]
    var: number
    cvar: number
    sharpeRatio: number
    maxDrawdown: number
  }
}

interface ClusteringResult {
  clusters: number[]
  embedding?: number[][]
  metrics: {
    silhouetteScore: number
    daviesBouldinScore: number
    calinskiHarabaszScore: number
  }
}

interface TimeSeriesResult {
  forecast: number[]
  confidence: {
    lower: number[]
    upper: number[]
  }
  metrics: {
    mse: number
    mae: number
    mape: number
    r2: number
  }
}

export const useMLAnalytics = (options: UseMLAnalyticsOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mlResult, setMLResult] = useState<MLAnalyticsResult | null>(null)
  const [riskResult, setRiskResult] = useState<RiskAnalyticsResult | null>(null)
  const [clusteringResult, setClusteringResult] = useState<ClusteringResult | null>(null)
  const [timeSeriesResult, setTimeSeriesResult] = useState<TimeSeriesResult | null>(null)

  const getPrediction = async (eventData: any) => {
    setIsLoading(true)
    setError(null)
    try {
      // Get optimized prediction using all models
      const optimizedPrediction = await predictionOptimizationService.getOptimizedPrediction(eventData)
      
      // Get additional insights
      const [patterns, communityInsights] = await Promise.all([
        mlService.detectPatterns(eventData.historicalData || []),
        mlService.getCommunityInsights(eventData.id)
      ])

      return {
        ...optimizedPrediction,
        patterns,
        communityInsights
      }
    } catch (err) {
      setError('Failed to get ML prediction')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const detectPatterns = async (historicalData: any[]) => {
    setIsLoading(true)
    setError(null)
    try {
      const patterns = await mlService.detectPatterns(historicalData)
      return patterns
    } catch (err) {
      setError('Failed to detect patterns')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const assessRisk = async (betData: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const assessment = await mlService.assessRisk(betData)
      return assessment
    } catch (err) {
      setError('Failed to assess risk')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getCommunityInsights = async (eventId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const insights = await mlService.getCommunityInsights(eventId)
      return insights
    } catch (err) {
      setError('Failed to get community insights')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const generateStrategy = async (preferences: any, riskTolerance: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const strategy = await mlService.generateAutomatedStrategy(
        preferences,
        riskTolerance
      )
      return strategy
    } catch (err) {
      setError('Failed to generate strategy')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeCorrelations = async (metrics: string[], timeframe: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const correlations = await mlService.getCorrelationAnalysis(
        metrics,
        timeframe
      )
      return correlations
    } catch (err) {
      setError('Failed to analyze correlations')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const createMetric = async (definition: any, validationData: any[]) => {
    setIsLoading(true)
    setError(null)
    try {
      const metric = await mlService.createCustomMetric(definition, validationData)
      return metric
    } catch (err) {
      setError('Failed to create custom metric')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const runMLAnalysis = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get optimized prediction for current data
      const optimizedPrediction = await predictionOptimizationService.getOptimizedPrediction({})

      // Set ML result
      setMLResult({
        predictions: [optimizedPrediction.prediction],
        probabilities: [optimizedPrediction.confidence],
        metrics: await mlService.getModelMetrics(),
        insights: {
          featureImportance: optimizedPrediction.insights.featureImportance,
          shap: {},
          lime: {}
        }
      })

      // Set risk result
      setRiskResult({
        riskMetrics: {
          overallRisk: optimizedPrediction.riskAssessment.riskScore,
          maxStake: optimizedPrediction.riskAssessment.maxStake,
          expectedValue: optimizedPrediction.riskAssessment.expectedValue
        },
        recommendations: {
          shouldBet: optimizedPrediction.riskAssessment.maxStake > 0,
          confidence: optimizedPrediction.confidence,
          maxStake: optimizedPrediction.riskAssessment.maxStake,
          expectedValue: optimizedPrediction.riskAssessment.expectedValue
        },
        simulation: {
          distribution: [],
          var: optimizedPrediction.insights.confidenceIntervals[0],
          cvar: optimizedPrediction.insights.confidenceIntervals[1],
          sharpeRatio: 0,
          maxDrawdown: 0
        }
      })

      // Get clustering result
      const clustering = await clusteringService.cluster([], {
        modelType: 'kmeans',
        params: { nClusters: 5 }
      })

      setClusteringResult({
        clusters: clustering.clusters,
        embedding: clustering.embedding,
        metrics: {
          silhouetteScore: 0,
          daviesBouldinScore: 0,
          calinskiHarabaszScore: 0
        }
      })

      // Get time series result
      const timeSeries = await timeSeriesService.getMetrics()

      setTimeSeriesResult({
        forecast: [],
        confidence: {
          lower: [],
          upper: []
        },
        metrics: {
          mse: timeSeries.mse,
          mae: timeSeries.mae,
          mape: timeSeries.mape,
          r2: timeSeries.r2
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (options.autoUpdate) {
      runMLAnalysis()
      const interval = setInterval(runMLAnalysis, options.updateInterval || 60000)
      return () => clearInterval(interval)
    } else {
      runMLAnalysis()
    }
  }, [runMLAnalysis, options.autoUpdate, options.updateInterval])

  const refreshAnalysis = useCallback(() => {
    runMLAnalysis()
  }, [runMLAnalysis])

  return {
    getPrediction,
    detectPatterns: mlService.detectPatterns.bind(mlService),
    assessRisk: mlService.assessRisk.bind(mlService),
    getCommunityInsights: mlService.getCommunityInsights.bind(mlService),
    generateStrategy: mlService.generateAutomatedStrategy.bind(mlService),
    analyzeCorrelations: mlService.getCorrelationAnalysis.bind(mlService),
    createMetric: mlService.createCustomMetric.bind(mlService),
    isLoading,
    error,
    mlResult,
    riskResult,
    clusteringResult,
    timeSeriesResult,
    refreshAnalysis
  }
}

export default useMLAnalytics 