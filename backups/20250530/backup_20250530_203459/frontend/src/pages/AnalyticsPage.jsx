import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastContext';

const Spinner = () => (
  <div className="flex justify-center items-center h-24">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

const AnalyticsPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    axios.get('/api/analytics')
      .then(response => {
        setMetrics(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Analytics fetch error');
        setLoading(false);
        toast('Analytics fetch error', 'error');
      });
  }, [toast]);

  if (loading) return <Spinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!metrics || Object.keys(metrics).length === 0) return <div className="p-4 text-gray-500">No analytics data available.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1 className="text-2xl font-bold mb-4">📈 Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded shadow p-4 text-center">
          <div className="text-gray-500">ROI</div>
          <div className="text-2xl font-bold text-green-600">{(metrics.roi * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <div className="text-gray-500">Model Accuracy</div>
          <div className="text-2xl font-bold text-blue-600">{(metrics.model_accuracy * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <div className="text-gray-500">Value Bet Success</div>
          <div className="text-2xl font-bold text-purple-600">{(metrics.value_bet_success * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <div className="text-gray-500">Top Players</div>
          <div className="text-lg font-semibold text-gray-800">{metrics.top_players && metrics.top_players.join(', ')}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;