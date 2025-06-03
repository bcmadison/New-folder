import { useEffect } from 'react'
import { useUltraMLAnalytics } from '@/hooks/useUltraMLAnalytics'
import { Card } from '@/components/common/Card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorMessage } from '@/components/common/ErrorMessage'

interface UltraMLInsightsProps {
  eventId: string
  betData: any
  bankroll: number
}

export const UltraMLInsights = ({
  eventId,
  betData,
  bankroll
}: UltraMLInsightsProps) => {
  const {
    analyzeUltraBet,
    quantumPredictions,
    marketPsychology,
    ultraRiskMetrics,
    blackSwanProtection,
    manipulationAlerts,
    isLoading,
    error
  } = useUltraMLAnalytics({
    autoUpdate: true,
    updateInterval: 1000, // 1 second for quantum-speed updates
    riskTolerance: 0.7,
    bankroll,
    blackSwanProtection: true,
    quantumOptimization: true
  })

  useEffect(() => {
    const analyzeCurrentBet = async () => {
      await analyzeUltraBet(betData)
    }
    analyzeCurrentBet()
  }, [betData, analyzeUltraBet])

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  const latestPrediction = quantumPredictions[0]

  return (
    <div className="space-y-6">
      {/* Quantum Prediction */}
      <Card title="Quantum State Analysis">
        {latestPrediction?.quantumPrediction && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Wave Function Collapse
                </h4>
                <p className="text-2xl font-bold text-primary-600">
                  {latestPrediction.quantumPrediction.waveFunctionCollapse.predictedState}
                </p>
                <p className="text-sm text-gray-500">
                  Certainty: {(latestPrediction.quantumPrediction.waveFunctionCollapse.certainty * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Alternate Universe Outcomes
                </h4>
                <div className="space-y-1">
                  {Object.entries(
                    latestPrediction.quantumPrediction.waveFunctionCollapse
                      .alternateUniverseProbabilities
                  ).map(([outcome, probability]: [string, any]) => (
                    <div
                      key={outcome}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {outcome}
                      </span>
                      <span className="text-sm font-medium text-primary-600">
                        {(probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Superposition States
              </h4>
              <div className="grid gap-3">
                {latestPrediction.quantumPrediction.superpositionStates.map(
                  (state: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-center"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {state.outcome}
                        </span>
                        <div className="text-sm text-gray-500">
                          Confidence: {(state.quantumConfidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      <span className="text-lg font-bold text-primary-600">
                        {(state.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Market Psychology */}
      <Card title="Advanced Market Psychology">
        {marketPsychology && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">Fear/Greed Index</h4>
              <p className="text-2xl font-bold text-primary-600">
                {marketPsychology.fearGreedIndex.toFixed(1)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">Smart Money Flow</h4>
              <p className="text-2xl font-bold text-primary-600">
                {marketPsychology.smartMoneyFlow.toFixed(1)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">Retail Panic</h4>
              <p className="text-2xl font-bold text-primary-600">
                {marketPsychology.retailPanicLevel.toFixed(1)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">Whale Activity</h4>
              <p className="text-2xl font-bold text-primary-600">
                {marketPsychology.whaleActivityIndex.toFixed(1)}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Ultra Risk Metrics */}
      <Card title="Quantum-Adjusted Risk">
        {ultraRiskMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">Quantum Kelly</h4>
              <p className="text-2xl font-bold text-primary-600">
                {(ultraRiskMetrics.quantumAdjustedKelly * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">Multiverse VaR</h4>
              <p className="text-2xl font-bold text-primary-600">
                ${ultraRiskMetrics.multiverseVaR.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">Psychological Risk</h4>
              <p className="text-2xl font-bold text-primary-600">
                {(ultraRiskMetrics.psychologicalRiskScore * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Black Swan Protection */}
      <Card title="Black Swan Defense">
        {blackSwanProtection && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Protection Level
                </h4>
                <span className="text-2xl font-bold text-primary-600">
                  {(blackSwanProtection.coverage * 100).toFixed(1)}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tail Risk Hedge</span>
                  <span className="font-medium text-primary-600">
                    ${ultraRiskMetrics.tailRiskHedge.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Systemic Exposure</span>
                  <span className="font-medium text-primary-600">
                    {(ultraRiskMetrics.systemicRiskExposure * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Market Manipulation Alerts */}
      <Card title="Manipulation Detection">
        {manipulationAlerts.length > 0 ? (
          <div className="space-y-4">
            {manipulationAlerts.map((alert: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded ${
                  alert.severity > 0.7
                    ? 'bg-red-50 dark:bg-red-900'
                    : alert.severity > 0.4
                    ? 'bg-yellow-50 dark:bg-yellow-900'
                    : 'bg-green-50 dark:bg-green-900'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4
                    className={`text-lg font-semibold ${
                      alert.severity > 0.7
                        ? 'text-red-800 dark:text-red-200'
                        : alert.severity > 0.4
                        ? 'text-yellow-800 dark:text-yellow-200'
                        : 'text-green-800 dark:text-green-200'
                    }`}
                  >
                    {alert.type}
                  </h4>
                  <span
                    className={`px-2 py-1 text-sm rounded ${
                      alert.severity > 0.7
                        ? 'bg-red-100 text-red-800'
                        : alert.severity > 0.4
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    Severity: {(alert.severity * 100).toFixed(1)}%
                  </span>
                </div>
                <p
                  className={`text-sm ${
                    alert.severity > 0.7
                      ? 'text-red-600 dark:text-red-300'
                      : alert.severity > 0.4
                      ? 'text-yellow-600 dark:text-yellow-300'
                      : 'text-green-600 dark:text-green-300'
                  }`}
                >
                  {alert.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-green-50 dark:bg-green-900 rounded">
            <p className="text-green-800 dark:text-green-200">
              No manipulation detected
            </p>
          </div>
        )}
      </Card>

      {/* Final Ultra Recommendation */}
      <Card title="Quantum AI Recommendation">
        {latestPrediction?.recommendation && (
          <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {latestPrediction.recommendation.shouldBet ? 'Place Bet' : 'Hold'}
              </h3>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  latestPrediction.recommendation.shouldBet
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {(latestPrediction.recommendation.confidence * 100).toFixed(1)}% Certainty
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-sm text-gray-500">Quantum-Optimized Stake</span>
                <p className="text-3xl font-bold text-primary-600">
                  ${latestPrediction.recommendation.stake.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Expected Value</span>
                <p className="text-3xl font-bold text-green-600">
                  ${latestPrediction.recommendation.expectedValue.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <span className="text-sm text-gray-500">Black Swan Protection</span>
                <p className="text-xl font-bold text-blue-600">
                  {(latestPrediction.recommendation.protectionLevel * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Manipulation Risk</span>
                <p className="text-xl font-bold text-red-600">
                  {(latestPrediction.recommendation.manipulationRisk * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
} 