import React from 'react';
import LineupBuilder from '../components/LineupBuilder.jsx';
import { motion } from 'framer-motion';

const LineupPage = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1 className="text-2xl font-bold mb-4">📋 Lineup Builder</h1>
      <LineupBuilder />
    </motion.div>
  );
};

export default LineupPage;
