import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PrizePicksAPI, PrizePicksProjection } from '../api/PrizePicksAPI';
import { UnifiedPredictionEngine } from '../core/UnifiedPredictionEngine';
import { UnifiedStrategyEngine } from '../core/UnifiedStrategyEngine';


interface OptimalPlay {
  projections: PrizePicksProjection[];
  expectedPayout: number;
  winProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

const MoneyMaker: React.FC = () => {
  const [entryAmount, setEntryAmount] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [optimalPlay, setOptimalPlay] = useState<OptimalPlay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projections, setProjections] = useState<PrizePicksProjection[]>([]);
  const [progress, setProgress] = useState<number>(0);
  
  const workerRef = useRef<Worker | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const prizePicksAPI = PrizePicksAPI.getInstance();
  const predictionEngine = UnifiedPredictionEngine.getInstance();
  const strategyEngine = UnifiedStrategyEngine.getInstance();

  const MIN_WIN_RATE = 0.84; // 84% minimum win rate requirement
  const BATCH_SIZE = 10; // Process combinations in batches

  useEffect(() => {
    // Initialize web worker
    workerRef.current = new Worker(new URL('../workers/combinationsWorker.ts', import.meta.url));
    
    // Set up worker message handler
    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'PROGRESS_UPDATE') {
        const { combinationsGenerated, isComplete } = event.data.data;
        setProgress(isComplete ? 100 : Math.min(99, (combinationsGenerated / 1000) * 100));
      } else if (event.data.type === 'COMBINATIONS_READY') {
        processCombinations(event.data.data);
      }
    };

    return () => {
      workerRef.current?.terminate();
      abortControllerRef.current?.abort();
    };
  }, []);

  // Fetch projections on mount and every 5 minutes
  useEffect(() => {
    const fetchProjections = async () => {
      try {
        const data = await prizePicksAPI.getProjections();
        setProjections(data);
      } catch (err) {
        console.error('Failed to fetch projections:', err);
      }
    };

    fetchProjections();
    const interval = setInterval(fetchProjections, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Memoize high confidence plays
  const highConfidencePlays = useMemo(() => 
    projections.filter(proj => proj.confidence >= MIN_WIN_RATE),
    [projections]
  );

  const processCombinations = async (combinations: PrizePicksProjection[][]) => {
    let bestOverallPlay: OptimalPlay | null = null;
    let maxExpectedValue = 0;

    // Create new abort controller for this processing batch
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      for (let i = 0; i < combinations.length; i += BATCH_SIZE) {
        // Check if processing was aborted
        if (signal.aborted) {
          throw new Error('Processing aborted');
        }

        const batchResult = await processCombinationsBatch(
          combinations.slice(i, i + BATCH_SIZE)
        );

        if (batchResult && batchResult.expectedPayout > maxExpectedValue) {
          maxExpectedValue = batchResult.expectedPayout;
          bestOverallPlay = batchResult;
        }
      }

      setOptimalPlay(bestOverallPlay);
    } catch (error) {
      if (error instanceof Error && error.message !== 'Processing aborted') {
        setError('Error processing combinations');
        console.error(error);
      }
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const processCombinationsBatch = async (
    combinations: PrizePicksProjection[][]
  ): Promise<OptimalPlay | null> => {
    let bestPlay: OptimalPlay | null = null;
    let maxExpectedValue = 0;

    await Promise.all(combinations.map(async (combo) => {
      try {
        const prediction = await predictionEngine.predict({
          playerId: combo.map(p => p.playerId).join(','),
          metric: 'combined_probability',
          timestamp: Date.now(),
          analysisType: 'multi_leg',
          parameters: {
            projections: combo
          },
          metadata: {
            entryAmount: entryAmount,
            legsCount: combo.length,
            sportType: combo[0].league
          }
        });

        if (prediction.confidence >= MIN_WIN_RATE) {
          const context = {
            playerId: combo[0].playerId,
            metric: combo[0].statType,
            timestamp: Date.now()
          };
          const inputs = [{
            id: 'primary',
            prediction: {
              value: prediction.value,
              confidence: prediction.confidence,
              factors: prediction.factors,
              analysis: prediction.analysis
            },
            weight: 1
          }];
          const strategy = await strategyEngine.generateStrategy(context, inputs, prediction.analysis);

          const expectedValue = strategy.expectedValue * entryAmount;
          if (expectedValue > maxExpectedValue) {
            maxExpectedValue = expectedValue;
            bestPlay = {
              projections: combo,
              expectedPayout: expectedValue,
              winProbability: prediction.confidence,
              riskLevel: strategy.riskAssessment.level
            };
          }
        }
      } catch (err) {
        console.error('Error processing combination:', err);
      }
    }));

    return bestPlay;
  };

  const findOptimalPlay = async () => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      if (highConfidencePlays.length === 0) {
        setError('No plays meeting the 84% win rate requirement found');
        return;
      }

      // Abort any ongoing processing
      abortControllerRef.current?.abort();

      // Start new worker calculation
      workerRef.current?.postMessage({
        type: 'GENERATE_COMBINATIONS',
        data: {
          projections: highConfidencePlays,
          maxLegs: 5
        }
      });

    } catch (err) {
      setError('Error finding optimal play');
      console.error(err);
      setIsLoading(false);
    }
  };

  // Memoize the optimal lineup display
  const OptimalLineup = useMemo(() => {
    if (!optimalPlay) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Optimal Lineup</h3>
        {optimalPlay.projections.map((proj) => (
          <div
            key={proj.id}
            className="p-4 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-between"
          >
            <div>
              <div className="text-white font-bold">{proj.playerName}</div>
              <div className="text-gray-400">
                {proj.teamAbbrev} • {proj.statType}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">
                {proj.lineScore}
              </div>
              <div className="text-green-500">
                {(proj.confidence * 100).toFixed(1)}% Win
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }, [optimalPlay]);

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700">
      <h2 className="text-3xl font-bold text-white mb-6">
        🚀 Let's Get Money 🚀
      </h2>

      {/* Entry Amount Input */}
      <div className="mb-8">
        <label className="block text-gray-400 mb-2">Entry Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-green-500">
            $
          </span>
          <input
            type="number"
            value={entryAmount}
            onChange={(e) => setEntryAmount(Math.max(0, Number(e.target.value)))}
            className="
              w-full pl-10 pr-4 py-3 rounded-xl
              bg-gray-800 border border-gray-600
              text-2xl font-bold text-white
              focus:outline-none focus:ring-2 focus:ring-green-500
            "
          />
        </div>
      </div>

      {/* Find Button */}
      <button
        onClick={findOptimalPlay}
        disabled={isLoading}
        className={`
          w-full py-4 rounded-xl text-xl font-bold
          transition-all duration-300
          ${isLoading
            ? 'bg-gray-700 text-gray-400 cursor-wait'
            : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
          }
        `}
      >
        {isLoading 
          ? `Finding Maximum Payout... ${progress.toFixed(1)}%`
          : '🚀 FIND MAXIMUM PAYOUT 🚀'
        }
      </button>

      {/* Results */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
          {error}
        </div>
      )}

      {optimalPlay && (
        <div className="mt-8 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-gray-400 mb-1">Expected Payout</div>
              <div className="text-2xl font-bold text-green-500">
                ${optimalPlay.expectedPayout.toFixed(2)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-gray-400 mb-1">Win Probability</div>
              <div className="text-2xl font-bold text-blue-500">
                {(optimalPlay.winProbability * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
              <div className="text-gray-400 mb-1">Number of Legs</div>
              <div className="text-2xl font-bold text-purple-500">
                {optimalPlay.projections.length}
              </div>
            </div>
          </div>

          {/* Projections */}
          {OptimalLineup}
        </div>
      )}
    </div>
  );
};

export default MoneyMaker; 