import { useEffect } from 'react'
import { useEvolutionaryAnalytics } from '@/hooks/useEvolutionaryAnalytics'
import { Card } from '@/components/common/Card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorMessage } from '@/components/common/ErrorMessage'

interface EvolutionaryInsightsProps {
  eventId: string
  betData: any
  bankroll: number
}

export const EvolutionaryInsights = ({
  eventId,
  betData,
  bankroll
}: EvolutionaryInsightsProps) => {
  const {
    analyzeEvolutionaryBet,
    gameTheoryAnalysis,
    evolutionaryMetrics,
    reinforcementMetrics,
    optimizedStrategies,
    competitiveDynamics,
    isLoading,
    error
  } = useEvolutionaryAnalytics({
    autoUpdate: true,
    updateInterval: 5000, // 5 seconds for evolutionary updates
    populationSize: 1000,
    generationLimit: 100,
    competitorCount: 5,
    simulationIterations: 1000
  })

  useEffect(() => {
    const analyzeCurrentBet = async () => {
      await analyzeEvolutionaryBet(betData)
    }
    analyzeCurrentBet()
  }, [betData, analyzeEvolutionaryBet])

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  const latestStrategy = optimizedStrategies[0]

  return (
    <div className="space-y-6">
      {/* Game Theory Analysis */}
      <Card title="Game Theory Analysis">
        {gameTheoryAnalysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Nash Equilibrium
                </h4>
                <div className="space-y-2 mt-2">
                  {gameTheoryAnalysis.nashEquilibrium.map(
                    (eq: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {eq.strategy}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-medium text-primary-600">
                            ${eq.payoff.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(eq.stability * 100).toFixed(1)}% stable)
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pareto Optimal Strategies
                </h4>
                <div className="space-y-2 mt-2">
                  {gameTheoryAnalysis.paretoOptimal.map(
                    (strategy: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {strategy.strategy}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-medium text-primary-600">
                            ${strategy.payoff.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(strategy.efficiency * 100).toFixed(1)}% efficient)
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Strategic Dominance
                </h4>
                <div className="space-y-4 mt-2">
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">
                      Dominant Strategies
                    </h5>
                    <div className="mt-1">
                      {gameTheoryAnalysis.strategicDominance.dominant.map(
                        (strategy: string, index: number) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 mr-2 mb-2 text-xs font-medium bg-green-100 text-green-800 rounded"
                          >
                            {strategy}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">
                      Dominated Strategies
                    </h5>
                    <div className="mt-1">
                      {gameTheoryAnalysis.strategicDominance.dominated.map(
                        (strategy: string, index: number) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 mr-2 mb-2 text-xs font-medium bg-red-100 text-red-800 rounded"
                          >
                            {strategy}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Coalition Formation
                </h4>
                <div className="space-y-2 mt-2">
                  {gameTheoryAnalysis.coalitionFormation.optimalCoalitions.map(
                    (coalition: string[], index: number) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Coalition {index + 1}
                          </span>
                          <span className="text-sm font-medium text-primary-600">
                            {(gameTheoryAnalysis.coalitionFormation.stabilityScores[
                              index
                            ] * 100).toFixed(1)}% stable
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {coalition.map((member, mIndex) => (
                            <span
                              key={mIndex}
                              className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                            >
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Evolutionary Metrics */}
      <Card title="Evolutionary Analysis">
        {evolutionaryMetrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Fitness Landscape
                </h4>
                <div className="space-y-4 mt-2">
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">Peaks</h5>
                    <div className="space-y-1 mt-1">
                      {evolutionaryMetrics.fitnessLandscape.peaks.map(
                        (peak: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {peak.strategy}
                            </span>
                            <span className="text-sm font-medium text-green-600">
                              {(peak.fitness * 100).toFixed(1)}%
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">Valleys</h5>
                    <div className="space-y-1 mt-1">
                      {evolutionaryMetrics.fitnessLandscape.valleys.map(
                        (valley: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {valley.strategy}
                            </span>
                            <span className="text-sm font-medium text-red-600">
                              {(valley.fitness * 100).toFixed(1)}%
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Population Dynamics
                </h4>
                <div className="space-y-4 mt-2">
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">
                      Dominant Strategies
                    </h5>
                    <div className="mt-1">
                      {evolutionaryMetrics.populationDynamics.dominantStrategies.map(
                        (strategy: string, index: number) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 mr-2 mb-2 text-xs font-medium bg-green-100 text-green-800 rounded"
                          >
                            {strategy}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">
                      Extinct Strategies
                    </h5>
                    <div className="mt-1">
                      {evolutionaryMetrics.populationDynamics.extinctStrategies.map(
                        (strategy: string, index: number) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 mr-2 mb-2 text-xs font-medium bg-red-100 text-red-800 rounded"
                          >
                            {strategy}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Adaptive Walk
              </h4>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">
                    Convergence Rate:
                  </span>
                  <span className="text-sm font-medium text-primary-600">
                    {(evolutionaryMetrics.adaptiveWalk.convergenceRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="relative h-8 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
                  {evolutionaryMetrics.adaptiveWalk.fitnessTrajectory.map(
                    (fitness: number, index: number) => {
                      const width = (100 / evolutionaryMetrics.adaptiveWalk.fitnessTrajectory.length)
                      const left = width * index
                      const height = fitness * 100
                      return (
                        <div
                          key={index}
                          className="absolute bottom-0 bg-primary-600"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            height: `${height}%`
                          }}
                        />
                      )
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Reinforcement Metrics */}
      <Card title="Reinforcement Learning">
        {reinforcementMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">
                Policy Gradients
              </h4>
              <div className="space-y-1 mt-2">
                {Object.entries(reinforcementMetrics.policyGradients).map(
                  ([action, gradient]) => (
                    <div
                      key={action}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {action}
                      </span>
                      <span className="text-sm font-medium text-primary-600">
                        {(gradient as number).toFixed(3)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">
                Value Estimates
              </h4>
              <div className="space-y-1 mt-2">
                {Object.entries(reinforcementMetrics.valueBaselines).map(
                  ([state, value]) => (
                    <div
                      key={state}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {state}
                      </span>
                      <span className="text-sm font-medium text-primary-600">
                        ${(value as number).toFixed(2)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-500">
                Learning Parameters
              </h4>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Entropy
                  </span>
                  <span className="text-sm font-medium text-primary-600">
                    {reinforcementMetrics.entropyRegularization.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Exploration
                  </span>
                  <span className="text-sm font-medium text-primary-600">
                    {(reinforcementMetrics.explorationRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Competitive Dynamics */}
      <Card title="Competitive Simulation">
        {competitiveDynamics && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Strategy Performance
                </h4>
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Relative Advantage</span>
                    <span className="text-sm font-medium text-primary-600">
                      {(latestStrategy.recommendation.competitiveAdvantage * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">
                      Evolutionary Stability
                    </span>
                    <span className="text-sm font-medium text-primary-600">
                      {(latestStrategy.recommendation.evolutionaryStability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Final Recommendation
                </h4>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        latestStrategy.recommendation.shouldBet
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {latestStrategy.recommendation.shouldBet ? 'Place Bet' : 'Hold'}
                    </span>
                    <span className="text-sm font-medium text-primary-600">
                      {(latestStrategy.recommendation.confidence * 100).toFixed(1)}% Confidence
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-sm text-gray-500">Optimal Stake</span>
                      <p className="text-lg font-bold text-primary-600">
                        ${latestStrategy.recommendation.stake.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Expected Value</span>
                      <p className="text-lg font-bold text-green-600">
                        ${latestStrategy.recommendation.expectedValue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
} 