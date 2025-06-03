# 🧠 AI Sports Betting Platform — Context Summary

## 🔍 General Purpose
A full-stack AI-powered sports betting platform that integrates live sports data and machine learning predictions. Designed to help users:

- Build optimized daily fantasy and betting lineups
- Understand predictions through SHAP explainability
- Analyze performance trends and model insights visually

---

## 🧩 System Components

### Backend (FastAPI)
- `/predictions` — Returns model predictions (CSV-backed or live)
- `/api/lineup` — Player pool for building lineups
- `/api/lineup/save` — Save submitted lineups
- `/api/analytics` — Returns model metrics
- `/api/health` — Status check endpoint

#### Data Sources
- ✅ **Sportradar** (player/game data)
- ✅ **TheOddsAPI** (odds)
- ✅ **ESPN Scraping** (backup/enrichment)

### Frontend (React + Tailwind + Framer Motion)
- Sidebar Navigation (🏠 Home, 📊 Dashboard, 📋 Lineups, 📈 Analytics, ⚙️ Settings)
- Axios-powered API connections
- Vite bundler
- Recharts for visualizations

---

## ✅ Immediate Enhancement Steps

### Step 1: 🔧 Lineup Builder Enhancements
- Add dropdown filters (team, sport)
- Player selection via click
- Save/export POST to backend
- Tooltips or modals for player details
- Future: PrizePicks integration

### Step 2: 📊 Predictions Dashboard
- Table view of prediction results
- Add filters (sport, date, confidence)
- Add SHAP logic per row
- Visual outcome markers (✅ ❌ ⏳)

### Step 3: 📈 Analytics Page
- Line chart for model accuracy
- Pie/bar charts by sport/team
- Show backend-provided metrics

---

## 🎯 Long-Term Goal

A powerful AI sports prediction assistant that’s:

- 🚀 Deployment-ready (Electron-wrapped)
- 🤖 Powered by explainable ML models
- 🔍 Integrated with real-time sports APIs
- 💡 Transparent and educational for bettors
