import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from '../components/ToastContext';
import { motion } from 'framer-motion';

const Spinner = () => (
  <div className="flex justify-center items-center h-24">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

const LineupBuilder = () => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [filterTeam, setFilterTeam] = useState('All');
  const [filterSport, setFilterSport] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modalPlayer, setModalPlayer] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    position: 'All',
    minStat: '',
    maxStat: '',
    player: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teams, setTeams] = useState([]);
  const [sports, setSports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  // Fetch lineup data (with optional refresh)
  const fetchLineup = async (refresh = false) => {
    setLoading(true);
    setError('');
    let url = '/api/lineup';
    const params = [];
    if (filterDate) params.push(`date=${filterDate}`);
    if (filterStatus !== 'All') params.push(`status=${filterStatus}`);
    if (filterTeam !== 'All') params.push(`team=${filterTeam}`);
    if (filterSport !== 'All') params.push(`sport=${filterSport}`);
    if (refresh) params.push('refresh=true');
    if (params.length) url += '?' + params.join('&');
    try {
      const res = await axios.get(url);
      const data = res.data.lineup || (Array.isArray(res.data) ? res.data : []);
      setPlayers(Array.isArray(data) ? data : []);
      if (res.data.teams) setTeams(res.data.teams);
      if (res.data.sports) setSports(res.data.sports);
      if (refresh) toast('Lineup and stats refreshed!', 'success');
    } catch (err) {
      setError('Lineup fetch error');
      toast('Lineup fetch error', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Run at startup and on filter change
  useEffect(() => {
    fetchLineup();
    // eslint-disable-next-line
  }, [filterDate, filterStatus, filterTeam, filterSport]);

  const handleSelect = player => {
    setSelectedPlayers(prev =>
      prev.some(p => p.id === player.id)
        ? prev.filter(p => p.id !== player.id)
        : [...prev, player]
    );
  };

  // Save lineup POST
  const handleSave = async () => {
    try {
      await axios.post('/api/lineup/save', selectedPlayers);
      toast('Lineup saved!', 'success');
    } catch (err) {
      toast('Failed to save lineup', 'error');
    }
  };

  const handleExport = (type) => {
    let dataStr, fileName;
    if (type === 'csv') {
      const header = Object.keys(selectedPlayers[0] || {}).join(',');
      const rows = selectedPlayers.map(p => Object.values(p).join(','));
      dataStr = [header, ...rows].join('\n');
      fileName = 'lineup.csv';
    } else {
      dataStr = JSON.stringify(selectedPlayers, null, 2);
      fileName = 'lineup.json';
    }
    const blob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
    toast('Lineup exported!', 'success');
  };

  // Unique filter options
  const positions = Array.from(new Set(players.map(p => p.position))).filter(Boolean);

  // Advanced filtering logic
  const filteredPlayers = players.filter(player => {
    const teamMatch = filterTeam === 'All' || player.team === filterTeam;
    const sportMatch = filterSport === 'All' || player.sport === filterSport;
    const positionMatch = advancedFilters.position === 'All' || player.position === advancedFilters.position;
    const minStatMatch = !advancedFilters.minStat || (player.stats && player.stats.value >= parseFloat(advancedFilters.minStat));
    const maxStatMatch = !advancedFilters.maxStat || (player.stats && player.stats.value <= parseFloat(advancedFilters.maxStat));
    const playerMatch = !advancedFilters.player || (player.name && player.name.toLowerCase().includes(advancedFilters.player.toLowerCase()));
    return teamMatch && sportMatch && positionMatch && minStatMatch && maxStatMatch && playerMatch;
  });

  if (loading) return <Spinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!Array.isArray(players) || players.length === 0) {
    return <div className="p-4 text-center text-gray-500">No players available for lineup. Please check your data source.</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4 items-end" role="region" aria-label="Lineup filters">
        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="filterTeam">Team</label>
          {/* Team filter dropdown */}
          <select id="filterTeam" className="border px-2 py-1" value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
            <option value="All">All</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="filterSport">Sport</label>
          {/* Sport filter dropdown */}
          <select id="filterSport" className="border px-2 py-1" value={filterSport} onChange={e => setFilterSport(e.target.value)}>
            <option value="All">All</option>
            {sports.map(sport => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="filterPosition">Position</label>
          <select id="filterPosition" className="border px-2 py-1" value={advancedFilters.position} onChange={e => setAdvancedFilters(f => ({ ...f, position: e.target.value }))}>
            <option value="All">All</option>
            {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="filterMinStat">Min Stat</label>
          <input id="filterMinStat" type="number" className="border px-2 py-1 w-20" value={advancedFilters.minStat} onChange={e => setAdvancedFilters(f => ({ ...f, minStat: e.target.value }))} placeholder="Min" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="filterMaxStat">Max Stat</label>
          <input id="filterMaxStat" type="number" className="border px-2 py-1 w-20" value={advancedFilters.maxStat} onChange={e => setAdvancedFilters(f => ({ ...f, maxStat: e.target.value }))} placeholder="Max" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="filterPlayer">Player</label>
          <input id="filterPlayer" type="text" className="border px-2 py-1" value={advancedFilters.player} onChange={e => setAdvancedFilters(f => ({ ...f, player: e.target.value }))} placeholder="Search..." />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="filterDate">Game Date</label>
          <input id="filterDate" type="date" className="border px-2 py-1" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="filterStatus">Game Status</label>
          <select id="filterStatus" className="border px-2 py-1" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All</option>
            <option value="live">Live</option>
            <option value="future">Future</option>
          </select>
        </div>

        {/* Selected count and clear button */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-700">Selected: {selectedPlayers.length}</span>
          <button
            className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => setSelectedPlayers([])}
            disabled={selectedPlayers.length === 0}
            title="Clear selection"
          >
            Clear
          </button>
        </div>

        {/* Export dropdown */}
        <div className="relative">
          <button
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => setShowExport(prev => !prev)}
            disabled={selectedPlayers.length === 0}
            title="Export lineup"
          >
            ⬇️ Export
          </button>
          {showExport && selectedPlayers.length > 0 && (
            <div className="absolute right-0 mt-1 bg-white border rounded shadow z-10">
              <button
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => handleExport('csv')}
              >
                Export as CSV
              </button>
              <button
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => handleExport('json')}
              >
                Export as JSON
              </button>
            </div>
          )}
        </div>

        {/* Refresh button */}
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          title="Refresh lineup and stats"
        >
          {refreshing ? (
            <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
          ) : (
            <span>🔄</span>
          )}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map(player => (
          <div
            key={player.id}
            className={`border p-3 rounded shadow cursor-pointer ${
              selectedPlayers.some(p => p.id === player.id)
                ? 'bg-blue-100 border-blue-500'
                : 'bg-white'
            }`}
            onClick={() => handleSelect(player)}
            title={`Click to ${
              selectedPlayers.some(p => p.id === player.id) ? 'remove' : 'add'
            } this player`}
          >
            <div className="font-bold flex items-center justify-between">
              {player.name}
              <button
                className="ml-2 text-xs text-blue-600 underline hover:text-blue-800"
                onClick={e => { e.stopPropagation(); setModalPlayer(player); }}
                title="Show details"
              >
                Details
              </button>
            </div>
            <div className="text-sm text-gray-600">{player.team} - {player.sport}</div>
          </div>
        ))}
      </div>

      {/* Modal for player details */}
      {modalPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setModalPlayer(null)}
              title="Close"
            >
              ✖
            </button>
            <h2 className="text-xl font-bold mb-2">{modalPlayer.name}</h2>
            <div className="mb-1">Team: <span className="font-semibold">{modalPlayer.team}</span></div>
            <div className="mb-1">Sport: <span className="font-semibold">{modalPlayer.sport}</span></div>
            <div className="mb-1">Position: <span className="font-semibold">{modalPlayer.position || 'N/A'}</span></div>
            <div className="mb-1">Stats: <span className="font-semibold">{modalPlayer.stats ? JSON.stringify(modalPlayer.stats) : 'N/A'}</span></div>
            {/* Add more player details as needed */}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={selectedPlayers.length === 0}
        aria-disabled={selectedPlayers.length === 0}
        aria-label="Save lineup"
      >
        💾 Save Lineup
      </button>
    </div>
  );
};

export default LineupBuilder;
