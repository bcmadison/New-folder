import { useEffect } from 'react'
import { useHyperMLAnalytics } from '@/hooks/useHyperMLAnalytics'
import { Card } from '@/components/common/Card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorMessage } from '@/components/common/ErrorMessage'

interface HyperMLInsightsProps {
  eventId: string
  betData: any
  bankroll: number
}

export const HyperMLInsights = ({
  eventId,
  betData,
  bankroll
}: HyperMLInsightsProps) => {
  const {
    analyzeBet,
    optimalBets,
    marketInsights,
    isLoading,
    error
  } = useHyperMLAnalytics({
    autoUpdate: true,
    updateInterval: 30000, // 30 seconds
    riskTolerance: 0.7,
    bankroll
  })

  useEffect(() => {
    const analyzeCurrentBet = async () => {
      await analyzeBet(betData)
    }
    analyzeCurrentBet()
  }, [betData, analyzeBet])

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  const latestBet = optimalBets[0]

  return (
    <div className="space-y-6">
      {/* Deep Analysis */}
      <Card title="Deep Market Analysis">
        {latestBet?.analysis && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">Market Efficiency</h4>
              <p className="text-2xl font-bold text-primary-600">
                {(latestBet.analysis.marketEfficiency * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">Momentum Score</h4>
              <p className="text-2xl font-bold text-primary-600">
                {(latestBet.analysis.momentumScore * 100).toFixed(1)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">Public Betting %</h4>
              <p className="text-2xl font-bold text-primary-600">
                {latestBet.analysis.publicBettingPercentage}%
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Risk Metrics */}
      <Card title="Advanced Risk Analysis">
        {latestBet?.riskMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">Kelly Stake</h4>
              <p className="text-2xl font-bold text-primary-600">
                ${latestBet.riskMetrics.kellyStake.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">Sharpe Ratio</h4>
              <p className="text-2xl font-bold text-primary-600">
                {latestBet.riskMetrics.sharpeRatio.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">Value at Risk</h4>
              <p className="text-2xl font-bold text-primary-600">
                ${latestBet.riskMetrics.valueAtRisk.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Market Inefficiencies */}
      <Card title="Market Inefficiencies">
        {latestBet?.marketInefficiencies && (
          <div className="space-y-4">
            {latestBet.marketInefficiencies.map((inefficiency: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {inefficiency.type}
                  </h4>
                  <span
                    className={`px-2 py-1 text-sm rounded ${
                      inefficiency.confidence > 0.8
                        ? 'bg-green-100 text-green-800'
                        : inefficiency.confidence > 0.6
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {(inefficiency.confidence * 100).toFixed(1)}% Confidence
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Expected Value</span>
                    <p className="text-xl font-bold text-green-600">
                      ${inefficiency.expectedValue.toFixed(2)}
                    </p>
                  </div>
                  {inefficiency.arbitrageOpportunity && (
                    <div>
                      <span className="text-sm text-gray-500">Guaranteed Return</span>
                      <p className="text-xl font-bold text-green-600">
                        ${inefficiency.hedgingStrategy?.guaranteedReturn.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Hedging Strategies */}
      <Card title="Hedging Opportunities">
        {latestBet?.hedgingStrategies && (
          <div className="space-y-4">
            {latestBet.hedgingStrategies.map((strategy: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Strategy {index + 1}
                  </h4>
                  <span className="text-sm font-medium text-green-600">
                    ${strategy.guaranteedReturn.toFixed(2)} Guaranteed
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded">
                    <span className="text-sm font-medium">Primary Bet</span>
                    <p className="text-gray-700 dark:text-gray-300">
                      ${strategy.primaryBet.stake} @ {strategy.primaryBet.odds}
                    </p>
                  </div>
                  {strategy.hedgeBets.map((hedge: any, hIndex: number) => (
                    <div
                      key={hIndex}
                      className="p-2 bg-gray-100 dark:bg-gray-600 rounded"
                    >
                      <span className="text-sm font-medium">Hedge {hIndex + 1}</span>
                      <p className="text-gray-700 dark:text-gray-300">
                        ${hedge.stake} @ {hedge.odds}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Final Recommendation */}
      <Card title="AI Recommendation">
        {latestBet?.recommendation && (
          <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {latestBet.recommendation.shouldBet ? 'Place Bet' : 'Hold'}
              </h3>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  latestBet.recommendation.shouldBet
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {(latestBet.recommendation.confidence * 100).toFixed(1)}% Confidence
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-sm text-gray-500">Recommended Stake</span>
                <p className="text-3xl font-bold text-primary-600">
                  ${latestBet.recommendation.stake.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Expected Value</span>
                <p className="text-3xl font-bold text-green-600">
                  ${latestBet.recommendation.expectedValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
} 