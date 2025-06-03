// src/pages/PredictionsDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ConfidenceIndicator from '../components/ConfidenceIndicator';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastContext';

function PredictionsDashboard() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shap, setShap] = useState(null);
  const [showShap, setShowShap] = useState(false);
  const [shapRow, setShapRow] = useState(null);
  const [filters, setFilters] = useState({
    team: 'All',
    sport: 'All',
    date: '',
    minConfidence: '',
    outcome: 'All',
    player: '',
  });
  const toast = useToast();

  useEffect(() => {
    axios.get('/predictions')
      .then(response => {
        setPredictions(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error fetching predictions');
        setLoading(false);
        toast('Error fetching predictions', 'error');
      });
  }, [toast]);

  const handleShowShap = (row) => {
    setShowShap(true);
    setShapRow(row);
    axios.get('/api/shap')
      .then(res => setShap(res.data.shap))
      .catch(() => setShap(null));
  };

  const outcomeIcon = (outcome) => {
    if (outcome === 'win' || outcome === '✅') return '✅';
    if (outcome === 'loss' || outcome === '❌') return '❌';
    return '⏳';
  };

  // Advanced filtering logic
  const filteredPredictions = predictions.filter(pred => {
    const teamMatch = filters.team === 'All' || pred.team === filters.team;
    const sportMatch = filters.sport === 'All' || pred.sport === filters.sport;
    const dateMatch = !filters.date || (pred.date && pred.date.startsWith(filters.date));
    const minConfMatch = !filters.minConfidence || (pred.confidence !== undefined && pred.confidence >= parseFloat(filters.minConfidence));
    const outcomeMatch = filters.outcome === 'All' || (pred.outcome && pred.outcome.toLowerCase() === filters.outcome.toLowerCase());
    const playerMatch = !filters.player || (pred.player && pred.player.toLowerCase().includes(filters.player.toLowerCase()));
    return teamMatch && sportMatch && dateMatch && minConfMatch && outcomeMatch && playerMatch;
  });

  // Unique filter options
  const teams = Array.from(new Set(predictions.map(p => p.team))).filter(Boolean);
  const sports = Array.from(new Set(predictions.map(p => p.sport))).filter(Boolean);
  const outcomes = Array.from(new Set(predictions.map(p => p.outcome))).filter(Boolean);

  const Spinner = () => (
    <div className="flex justify-center items-center h-24">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  if (loading) return <Spinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!Array.isArray(predictions) || predictions.length === 0) return <div className="p-4 text-gray-500">No predictions available.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1 className="text-2xl font-bold mb-4">📊 Predictions Dashboard</h1>
      {/* Advanced Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1">Team</label>
          <select className="border px-2 py-1" value={filters.team} onChange={e => setFilters(f => ({ ...f, team: e.target.value }))}>
            <option value="All">All</option>
            {teams.map(team => <option key={team} value={team}>{team}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Sport</label>
          <select className="border px-2 py-1" value={filters.sport} onChange={e => setFilters(f => ({ ...f, sport: e.target.value }))}>
            <option value="All">All</option>
            {sports.map(sport => <option key={sport} value={sport}>{sport}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Date</label>
          <input type="date" className="border px-2 py-1" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Min Confidence</label>
          <input type="number" min="0" max="1" step="0.01" className="border px-2 py-1 w-20" value={filters.minConfidence} onChange={e => setFilters(f => ({ ...f, minConfidence: e.target.value }))} placeholder="0.7" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Outcome</label>
          <select className="border px-2 py-1" value={filters.outcome} onChange={e => setFilters(f => ({ ...f, outcome: e.target.value }))}>
            <option value="All">All</option>
            {outcomes.map(outcome => <option key={outcome} value={outcome}>{outcome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Player</label>
          <input type="text" className="border px-2 py-1" value={filters.player} onChange={e => setFilters(f => ({ ...f, player: e.target.value }))} placeholder="Search..." />
        </div>
      </div>
      {filteredPredictions.length === 0 ? (
        <p>No predictions match your filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 bg-white">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Player</th>
                <th className="p-2 border">Team</th>
                <th className="p-2 border">Matchup</th>
                <th className="p-2 border">Predicted</th>
                <th className="p-2 border">Actual</th>
                <th className="p-2 border">Confidence</th>
                <th className="p-2 border">Outcome</th>
                <th className="p-2 border">Explain</th>
              </tr>
            </thead>
            <tbody>
              {filteredPredictions.map((pred, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-2 border">{pred.player}</td>
                  <td className="p-2 border">{pred.team}</td>
                  <td className="p-2 border">{pred.matchup}</td>
                  <td className="p-2 border">{pred.predicted}</td>
                  <td className="p-2 border">{pred.actual ?? '-'}</td>
                  <td className="p-2 border">
                    {pred.confidence !== undefined && <ConfidenceIndicator confidence={pred.confidence} />}
                  </td>
                  <td className="p-2 border text-xl">{outcomeIcon(pred.outcome)}</td>
                  <td className="p-2 border">
                    <button className="text-blue-600 underline text-xs" onClick={() => handleShowShap(pred)}>
                      SHAP
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* SHAP Modal */}
      {showShap && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowShap(false)}
              title="Close"
            >
              ✖
            </button>
            <h2 className="text-xl font-bold mb-2">SHAP Explainability</h2>
            {shap ? (
              <div>
                {Object.entries(shap).map(([feature, value]) => (
                  <div key={feature} className="flex justify-between border-b py-1">
                    <span className="font-semibold">{feature}</span>
                    <span>{value.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>Loading SHAP values...</div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default PredictionsDashboard;
