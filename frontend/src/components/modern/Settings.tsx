import React, { useState } from 'react';
import { DataIntegrationHub } from '../../core/DataIntegrationHub';
import { useAppState } from './StateProvider';


const Settings: React.FC = () => {
  const { props, entries } = useAppState();
  const [lastSync, setLastSync] = useState(new Date());
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  const handleExport = (type: 'csv' | 'json') => {
    const data = { props, entries };
    const blob = new Blob([
      type === 'json' ? JSON.stringify(data, null, 2) : toCSV(data)
    ], { type: type === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `betting-data.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  function toCSV(data: any) {
    // Simple CSV export for demo
    const propRows = data.props.map((p: any) => `${p.id},${p.player},${p.team},${p.stat},${p.line},${p.type},${p.percentage}`);
    const entryRows = data.entries.map((e: any) => `${e.id},${e.date},${e.legs},${e.entry},${e.potentialPayout},${e.status}`);
    return `Props\nID,Player,Team,Stat,Line,Type,Percentage\n${propRows.join('\n')}\n\nEntries\nID,Date,Legs,Entry,PotentialPayout,Status\n${entryRows.join('\n')}`;
  }

  // Data source health
  const hub = DataIntegrationHub.getInstance();
  const metrics = Array.from(hub.getSourceMetrics().entries());

  return (
    <main className="section space-y-6 lg:space-y-8 animate-fade-in">
      <div className="modern-card p-6 lg:p-8">
        <h2 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8">⚙️ Settings</h2>
        <div className="space-y-8">
          <div className="border-b pb-6">
            <h3 className="text-lg lg:text-xl font-bold mb-6">Appearance</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="font-medium">Dark Mode</span>
                <input type="checkbox" className="accent-primary-500 w-5 h-5" />
              </label>
              <label className="flex items-center justify-between">
                <span className="font-medium">Compact View</span>
                <input type="checkbox" className="accent-primary-500 w-5 h-5" />
              </label>
            </div>
          </div>
          <div className="border-b pb-6">
            <h3 className="text-lg lg:text-xl font-bold mb-6">Notifications</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="font-medium">Live Updates</span>
                <input type="checkbox" checked={liveUpdates} onChange={() => setLiveUpdates(v => !v)} className="accent-primary-500 w-5 h-5" />
              </label>
              <label className="flex items-center justify-between">
                <span className="font-medium">Arbitrage Alerts</span>
                <input type="checkbox" checked className="accent-primary-500 w-5 h-5" />
              </label>
              <label className="flex items-center justify-between">
                <span className="font-medium">High Confidence Picks</span>
                <input type="checkbox" checked className="accent-primary-500 w-5 h-5" />
              </label>
            </div>
          </div>
          <div>
            <h3 className="text-lg lg:text-xl font-bold mb-6">Data &amp; Privacy</h3>
            <div className="space-y-3">
              <button className="w-full p-4 lg:p-6 glass rounded-xl lg:rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left" onClick={() => handleExport('csv')}>
                Export Betting Data (CSV)
              </button>
              <button className="w-full p-4 lg:p-6 glass rounded-xl lg:rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left" onClick={() => handleExport('json')}>
                Export Betting Data (JSON)
              </button>
              <button className="w-full p-4 lg:p-6 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-xl lg:rounded-2xl hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-left">
                Clear All Data
              </button>
            </div>
            <div className="mt-6">
              <h4 className="font-bold mb-2">Data Source Health</h4>
              <ul className="text-sm">
                {metrics.map(([id, m]) => (
                  <li key={id} className="mb-1">
                    <span className="font-semibold">{id}</span>: Latency {m.latency.toFixed(0)}ms, Reliability {(m.reliability * 100).toFixed(1)}%, Last Sync {new Date(m.lastSync).toLocaleTimeString()}
                  </li>
                ))}
              </ul>
              <div className="text-xs text-gray-500 mt-2">Last Sync: {lastSync.toLocaleTimeString()}</div>
            </div>
            <div className="mt-6">
              <label className="flex items-center justify-between">
                <span className="font-medium">Enable Analytics</span>
                <input type="checkbox" checked={analyticsEnabled} onChange={() => setAnalyticsEnabled(v => !v)} className="accent-primary-500 w-5 h-5" />
              </label>
              <label className="flex items-center justify-between mt-2">
                <span className="font-medium">Allow Data Sharing</span>
                <input type="checkbox" checked={dataSharing} onChange={() => setDataSharing(v => !v)} className="accent-primary-500 w-5 h-5" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Settings; 