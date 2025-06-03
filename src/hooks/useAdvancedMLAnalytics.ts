import { useState } from 'react'
import { advancedMLService } from '@/services/analytics/advancedMLService'

interface UseAdvancedMLAnalyticsOptions {
  autoUpdate?: boolean
  updateInterval?: number
}

export const useAdvancedMLAnalytics = (options: UseAdvancedMLAnalyticsOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getEnsemblePrediction = async (eventData: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const prediction = await advancedMLService.getEnsemblePrediction(eventData)
      return prediction
    } catch (err) {
      setError('Failed to get ensemble prediction')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getModelMetrics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const metrics = await advancedMLService.getModelMetrics()
      return metrics
    } catch (err) {
      setError('Failed to get model metrics')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getFeatureImportance = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const importance = await advancedMLService.getFeatureImportance()
      return importance
    } catch (err) {
      setError('Failed to get feature importance')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateModelWeights = async (weights: Record<string, number>) => {
    setIsLoading(true)
    setError(null)
    try {
      await advancedMLService.updateModelWeights(weights)
    } catch (err) {
      setError('Failed to update model weights')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    getEnsemblePrediction,
    getModelMetrics,
    getFeatureImportance,
    updateModelWeights,
    isLoading,
    error,
  }
} 