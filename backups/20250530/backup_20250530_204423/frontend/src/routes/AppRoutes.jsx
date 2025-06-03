import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import HomePage from "../pages/HomePage";
import LineupPage from "../pages/LineupPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import SHAPExplain from "../pages/SHAPExplain";
import PredictionsDashboard from "../pages/PredictionsDashboard";
import SettingsPage from "../pages/SettingsPage";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/lineup" element={<LineupPage />} />
        <Route path="/predictions" element={<PredictionsDashboard />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/shap" element={<SHAPExplain />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}
