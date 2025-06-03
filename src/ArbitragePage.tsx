import React, { useState } from 'react';



interface ArbitrageOpportunity {
  id: string;
  sport: string;
  event: string;
  market: string;
  bookmaker1: {
    name: string;
    odds: number;
    stake: number;
  };
  bookmaker2: {
    name: string;
    odds: number;
    stake: number;
  };
  profit: number;
  profitPercentage: number;
  expiresAt: string;
}

const ArbitragePage: React.FC = () => {
  // TODO: Replace with real API calls to fetch arbitrage opportunities
  const [minProfit, setMinProfit] = useState<number>(10);
  const [selectedSports, setSelectedSports] = useState<string[]>(['NBA', 'NFL', 'MLB']);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);

  // Scaffold: Show loading, error, or empty state
  // TODO: Implement real loading and error handling
  // useEffect(() => { fetch opportunities from backend }, [])

  const filteredOpportunities = opportunities.filter(
    opp => opp.profit >= minProfit && selectedSports.includes(opp.sport)
  );

  return (
    <main className="section space-y-6 lg:space-y-8 animate-fade-in">
      <div className="modern-card p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold">🔄 Arbitrage Finder</h1>
          <div className="flex flex-wrap gap-4">
            {/* Min Profit Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Min Profit $</label>
              <input
                type="number"
                value={minProfit}
                onChange={(e) => setMinProfit(Number(e.target.value))}
                className="modern-input w-24"
                min="0"
                step="5"
              />
            </div>
            {/* Sport Filters */}
            <div className="flex rounded-lg overflow-hidden">
              {['NBA', 'NFL', 'MLB'].map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSports(prev =>
                    prev.includes(sport)
                      ? prev.filter(s => s !== sport)
                      : [...prev, sport]
                  )}
                  className={`px-4 py-2 text-sm font-medium ${
                    selectedSports.includes(sport)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Opportunities List */}
        <div className="space-y-4">
          {filteredOpportunities.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No arbitrage opportunities available. {/* TODO: Fetch from backend */}
            </div>
          ) : (
            filteredOpportunities.map((opp) => (
              <div key={opp.id} className="modern-card p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">{opp.event}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{opp.sport} • {opp.market}</p>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Profit</p>
                      <p className="text-lg font-bold text-green-600">${opp.profit.toFixed(2)}</p>
                      <p className="text-xs text-green-600">({opp.profitPercentage.toFixed(2)}%)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expires</p>
                      <p className="text-sm">{new Date(opp.expiresAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="modern-card p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{opp.bookmaker1.name}</span>
                      <span className="text-lg font-bold">{opp.bookmaker1.odds}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Stake: ${opp.bookmaker1.stake.toFixed(2)}</div>
                  </div>
                  <div className="modern-card p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{opp.bookmaker2.name}</span>
                      <span className="text-lg font-bold">{opp.bookmaker2.odds}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Stake: ${opp.bookmaker2.stake.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button className="modern-button">Place Bets</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default ArbitragePage; 