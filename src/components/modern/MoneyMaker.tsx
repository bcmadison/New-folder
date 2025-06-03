import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { bettingStrategyService } from '../../services/bettingStrategy';
import { ParlayLeg, BettingOpportunity, FrontendBetLeg, BettingStrategyRequest } from '../../../../shared/betting';
import { PrizePicksProps } from '../../../../shared/prizePicks';
import { Lightbulb, AlertTriangle, CheckCircle, Loader2, Search } from 'lucide-react';

const MoneyMaker: React.FC = () => {
  const {
    appProps,
    fetchAppProps,
    isLoadingAppProps,
    errorAppProps: appPropsLoadingError,
    addLeg,
    addToast,
  } = useAppStore((state) => ({
    appProps: state.props,
    fetchAppProps: state.fetchProps,
    isLoadingAppProps: state.isLoadingProps,
    errorAppProps: state.error,
    betSlipLegs: state.legs,
    addLeg: state.addLeg,
    removeLeg: state.removeLeg,
    addToast: state.addToast,
  }));

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPropIdsRaw, setSelectedPropIds] = useState<string[] | undefined>([]);
  const safeSelectedPropIds = Array.isArray(selectedPropIdsRaw) ? selectedPropIdsRaw : [];
  const [minProbability, setMinProbability] = useState(84);
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(false);
  let [strategyResult, setStrategyResult] = useState<BettingOpportunity[]>([]);
  if (!Array.isArray(strategyResult)) strategyResult = [];
  const safeStrategyResult = Array.isArray(strategyResult) ? strategyResult : [];
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [bankroll, setBankroll] = useState(100);

  // Defensive: check if value is defined before accessing .length
  const safeLength = (val: any) => (val && (Array.isArray(val) || typeof val === 'string') ? val.length : 0);

  useEffect(() => {
    if (!Array.isArray(appProps) || appProps.length === 0) {
      fetchAppProps();
    }
  }, [fetchAppProps, appProps?.length]);

  const availablePropsToSelect = useMemo(() => {
    return (Array.isArray(appProps) ? appProps : []).filter(p => 
        (p.player_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         p.stat_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.league?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [appProps, searchTerm]);

  const togglePropSelection = (propId: string) => {
    setSelectedPropIds(prev => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.includes(propId) ? arr.filter(id => id !== propId) : [...arr, propId];
    });
  };

  const handleFindOptimalParlay = async () => {
    if ((safeSelectedPropIds?.length ?? 0) < 2 || (safeSelectedPropIds?.length ?? 0) > 6) {
      addToast({ message: 'Please select between 2 and 6 props.', type: 'warning' });
      return;
    }
    setIsLoadingStrategy(true);
    setStrategyResult([]);
    setStrategyError(null);
    try {
      const selectedFullProps = (Array.isArray(safeSelectedPropIds) ? safeSelectedPropIds : []).map(id => (Array.isArray(appProps) ? appProps : []).find(p => p.id === id)).filter(p => p) as PrizePicksProps[];
      
      if (selectedFullProps.some(p => p.overOdds === undefined && p.underOdds === undefined)) {
          addToast({message: 'Some selected props are missing comprehensive odds data. Cannot calculate strategy robustly.', type: 'warning'});
          console.warn("Proceeding with strategy calculation despite some props missing detailed over/under odds.");
      }

      const riskPercentage = (100 - minProbability);
      let riskLevelString: string;
      if (riskPercentage <= 20) riskLevelString = "low";
      else if (riskPercentage <= 50) riskLevelString = "medium";
      else riskLevelString = "high";

      const params: BettingStrategyRequest = {
        propositions: (Array.isArray(selectedFullProps) ? selectedFullProps : []).map(p => ({
            propId: p.id,
            line: p.line_score,
            overOdds: p.overOdds, 
            underOdds: p.underOdds,
            statType: p.stat_type,
            playerName: p.player_name,
        })), 
        bankroll: bankroll,
        riskLevel: riskLevelString,
      };
      
      const result = await bettingStrategyService.calculateBettingStrategy(params);
      setStrategyResult(result);
      addToast({ message: 'Optimal strategy calculated!', type: 'success' });
    } catch (e: any) {
      setStrategyError(e.message || 'Failed to calculate strategy.');
      addToast({ message: `Error: ${e.message || 'Failed to calculate strategy.'}`, type: 'error' });
    } finally {
      setIsLoadingStrategy(false);
    }
  };

  const estimatedPayout = useMemo(() => {
    if (safeLength(safeSelectedPropIds) < 2) return '0.00';
    const mockStake = 10;
    const approxMultiplier = Math.pow(1.8, safeLength(safeSelectedPropIds));
    return (mockStake * approxMultiplier).toFixed(2);
  }, [safeSelectedPropIds]);

  const addRecommendedBetToSlip = (opportunity: BettingOpportunity, leg: FrontendBetLeg) => {
    const legToAdd: ParlayLeg = {
        propId: leg.propId,
        pick: leg.outcome.toLowerCase() as 'over' | 'under',
        line: leg.line !== undefined ? leg.line : (Array.isArray(appProps) ? appProps.find(p=>p.id === leg.propId)?.line_score : 0) || 0,
        odds: typeof leg.odds === 'number' ? leg.odds : 0,
        statType: leg.statType || (Array.isArray(appProps) ? appProps.find(p=>p.id === leg.propId)?.stat_type : undefined) || 'Unknown',
        playerName: leg.playerName || (Array.isArray(appProps) ? appProps.find(p=>p.id === leg.propId)?.player_name : undefined) || 'Unknown',
    };
    if (legToAdd.odds === undefined) {
        addToast({message: `Cannot add recommended bet for ${legToAdd.playerName} - missing odds.`, type: 'error'});
        return;
    }
    addLeg(legToAdd);
    addToast({ message: `Added ${legToAdd.playerName} ${legToAdd.pick} ${legToAdd.line} from opportunity ${opportunity.id.substring(0,6)} to slip.`, type: 'info' });
  };

  return (
    <div className="p-6 glass rounded-xl shadow-lg space-y-5">
      <div className="flex items-center space-x-2">
        <Lightbulb className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-semibold text-text">Money Maker Engine</h3>
      </div>
      
      <div className="space-y-3">
        <p className="text-text-muted text-sm">
          Select 2-6 base props. The engine will find optimal parlays attempting to meet your minimum win probability target.
        </p>
        <div className="mb-3">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"/>
                <input 
                    type="text"
                    placeholder="Search available props (player, stat, league)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-surface/50 border border-gray-600 rounded-lg text-text focus:ring-primary focus:border-primary"
                />
            </div>
        </div>
        {isLoadingAppProps && <p className="text-text-muted">Loading available props...</p>}
        {!isLoadingAppProps && appPropsLoadingError && safeLength(appProps) === 0 && (
          <div className="p-3 bg-red-500/10 text-red-400 rounded-lg flex items-center space-x-2">
            <AlertTriangle size={20}/>
            <p>Error loading available props: {appPropsLoadingError}</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
            {(Array.isArray(availablePropsToSelect) ? availablePropsToSelect : []).map(prop => (
            <div 
                key={prop.id}
                onClick={() => togglePropSelection(prop.id)}
                className={`p-3 bg-surface/50 rounded-lg cursor-pointer border-2 transition-all
                            ${safeSelectedPropIds.includes(prop.id) ? 'border-primary shadow-md' : 'border-transparent hover:border-primary/50'}`}
            >
                <label htmlFor={`prop-${prop.id}`} className="text-sm text-text-muted font-medium cursor-pointer flex items-center justify-between">
                <span>{prop.player_name} - {prop.stat_type} ({prop.line_score})</span>
                <input 
                    type="checkbox" 
                    id={`prop-${prop.id}`} 
                    checked={safeSelectedPropIds.includes(prop.id)}
                    onChange={() => {}} 
                    className="form-checkbox h-5 w-5 text-primary bg-gray-700 border-gray-600 focus:ring-primary/50 rounded cursor-pointer"
                />
                </label>
            </div>
            ))}
            {!isLoadingAppProps && (!Array.isArray(availablePropsToSelect) || safeLength(availablePropsToSelect) === 0) && <p className="text-text-muted">No props match your search or none available.</p>}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="minProbability" className="block text-sm font-medium text-text-muted mb-1">
          Minimum Target Win Probability (%)
        </label>
        <input 
          type="number" 
          id="minProbability" 
          value={minProbability}
          onChange={(e) => setMinProbability(Math.max(50, Math.min(100, Number(e.target.value))))}
          min="50" 
          max="100" 
          className="w-full p-2 bg-surface/70 border border-gray-600 rounded-lg text-text focus:ring-primary focus:border-primary shadow-sm"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="bankroll" className="block text-sm font-medium text-text-muted mb-1">
          Bankroll ($)
        </label>
        <input 
          type="number" 
          id="bankroll" 
          value={bankroll}
          onChange={(e) => setBankroll(Math.max(0, Number(e.target.value)))}
          min="0" 
          className="w-full p-2 bg-surface/70 border border-gray-600 rounded-lg text-text focus:ring-primary focus:border-primary shadow-sm"
        />
      </div>

      <button 
        onClick={handleFindOptimalParlay}
        disabled={isLoadingStrategy || safeLength(safeSelectedPropIds) < 2 || safeLength(safeSelectedPropIds) > 6}
        className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-lg shadow-md hover:shadow-lg"
      >
        {isLoadingStrategy ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Lightbulb className="w-6 h-6 mr-2" />}
        Find Optimal Parlay
      </button>

      {safeLength(safeSelectedPropIds) > 0 && safeLength(safeStrategyResult) === 0 && !isLoadingStrategy && (
        <div className="mt-4 p-3 bg-surface/30 rounded-lg">
          <p className="text-sm text-text-muted">Estimated Payout for selected props: <span className="font-semibold text-accent">${estimatedPayout}</span> (Note: This is a rough pre-calculation estimate, final payout depends on strategy outcome and actual odds of chosen picks)</p>
        </div>
      )}

      {strategyError && (
        <div className="mt-4 p-3 bg-red-500/10 text-red-400 rounded-lg flex items-center space-x-2">
            <AlertTriangle size={20}/>
            <p>{strategyError}</p>
        </div>
      )}

      {safeLength(safeStrategyResult) > 0 && (
        <div className="mt-5 p-4 bg-surface/50 rounded-lg space-y-4 shadow">
            <h4 className="text-lg font-semibold text-primary flex items-center"><CheckCircle size={20} className="mr-2"/> Strategy Calculated!</h4>
            {safeStrategyResult.map((opportunity, oppIndex) => (
              <div key={opportunity.id || oppIndex} className="p-3 bg-surface/30 rounded-md shadow-sm">
                <p className="text-md font-medium text-text-muted">
                  Opportunity: {opportunity.description} (EV: {opportunity.expectedValue?.toFixed(2) ?? 'N/A'}, Confidence: {(opportunity.confidence !== undefined ? opportunity.confidence * 100 : 'N/A')}%, Type: {opportunity.type})
                </p>
                <p className="text-xs text-text-muted mb-1">Stake Suggestion: ${opportunity.stakeSuggestion?.toFixed(2) ?? 'N/A'} | Potential Payout: ${opportunity.potentialPayout?.toFixed(2) ?? 'N/A'}</p>
                <h5 className="text-sm font-medium text-text-muted pt-1">Legs:</h5>
                {(() => {
                  const legs = Array.isArray(opportunity?.legs) ? opportunity.legs : [];
                  return safeLength(legs) > 0 ? (
                    <ul className="space-y-1 mt-1">
                      {legs.map((leg: FrontendBetLeg, legIndex: number) => {
                        const originalProp = Array.isArray(appProps) ? appProps.find(p => p.id === leg.propId) : undefined;
                        return (
                            <li key={leg.propId + leg.outcome + legIndex} className="p-2 bg-surface/20 rounded flex justify-between items-center">
                            <div>
                                <span className="text-xs text-text-muted">
                                    {leg.playerName || originalProp?.player_name || leg.propId} {leg.outcome.toUpperCase()} {leg.line ?? originalProp?.line_score ?? 'N/A'}
                                </span>
                              <span className="block text-xxs text-accent">Odds: {leg.odds?.toFixed ? leg.odds.toFixed(2) : 'N/A'}</span>
                            </div>
                            <button 
                                onClick={() => addRecommendedBetToSlip(opportunity, leg)}
                                className="px-2 py-1 text-xxs bg-primary/70 hover:bg-primary text-white rounded transition-colors"
                            >
                                Add to Slip
                            </button>
                            </li>
                        );
                    })}
                    </ul>
                ) : (
                    <p className="text-xs text-text-muted">No legs for this opportunity.</p>
                  );
                })()}
              </div>
            ))}
        </div>
      )}
      {safeLength(safeStrategyResult) === 0 && (
        <div className="mt-4 p-3 bg-yellow-500/10 text-yellow-300 rounded-lg">
            <p>The strategy engine did not find any specific opportunities based on your selections and criteria.</p>
        </div>
      )}
    </div>
  );
};

export default MoneyMaker; 