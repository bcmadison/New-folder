import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const shapData = [
  { feature: 'Fatigue', value: 0.24 },
  { feature: 'Travel', value: 0.19 },
  { feature: 'Last Game Pts', value: 0.14 },
  { feature: 'Odds Shift', value: 0.12 },
  { feature: 'Volume', value: 0.08 }
];

const SHAPExplain = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1 className="text-2xl font-semibold mb-4">🧮 SHAP Explainability</h1>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={shapData} layout="vertical" margin={{ left: 50 }}>
          <XAxis type="number" domain={[0, 0.3]} />
          <YAxis type="category" dataKey="feature" />
          <Tooltip />
          <Bar dataKey="value" fill="#1d4ed8" />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default SHAPExplain;