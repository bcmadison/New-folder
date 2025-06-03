import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useToast } from '../components/ToastContext';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    axios.get('/api/settings')
      .then(res => {
        setSettings(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load settings');
        setLoading(false);
        toast('Failed to load settings', 'error');
      });
  }, [toast]);

  const Spinner = () => (
    <div className="flex justify-center items-center h-24">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  if (loading) return <Spinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!settings || Object.keys(settings).length === 0) return <div className="p-4 text-gray-500">No settings data available.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1 className="text-2xl font-bold mb-4">⚙️ Settings</h1>
      <div className="space-y-4 max-w-md">
        <div className="flex items-center justify-between bg-white p-4 rounded shadow">
          <span>Social Sentiment Enabled</span>
          <input type="checkbox" checked={settings.social_sentiment_enabled} readOnly />
        </div>
        <div className="flex items-center justify-between bg-white p-4 rounded shadow">
          <span>Volatility Detection</span>
          <input type="checkbox" checked={settings.volatility_detection} readOnly />
        </div>
        <div className="flex items-center justify-between bg-white p-4 rounded shadow">
          <span>Prediction Confidence Threshold</span>
          <span className="font-mono">{settings.prediction_confidence_threshold}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
