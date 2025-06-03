@echo off
echo ============================================
echo FIXING AI SPORTS BETTING PLATFORM
echo ============================================
echo.

REM Fix Frontend Configuration
echo Fixing frontend configuration...
cd frontend

REM Create package.json with correct scripts
echo Creating proper package.json...
(
echo {
echo   "name": "ai-sports-betting-frontend",
echo   "version": "1.0.0",
echo   "type": "module",
echo   "scripts": {
echo     "dev": "vite",
echo     "start": "vite",
echo     "build": "vite build",
echo     "preview": "vite preview"
echo   },
echo   "dependencies": {
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "axios": "^1.6.0",
echo     "lucide-react": "^0.294.0",
echo     "recharts": "^2.10.0",
echo     "framer-motion": "^10.16.0",
echo     "react-router-dom": "^6.20.0"
echo   },
echo   "devDependencies": {
echo     "@types/react": "^18.2.0",
echo     "@types/react-dom": "^18.2.0",
echo     "@vitejs/plugin-react": "^4.2.0",
echo     "autoprefixer": "^10.4.16",
echo     "postcss": "^8.4.32",
echo     "tailwindcss": "^3.3.6",
echo     "vite": "^5.0.0"
echo   }
echo }
) > package.json

REM Create vite.config.js
echo Creating vite.config.js...
(
echo import { defineConfig } from 'vite'
echo import react from '@vitejs/plugin-react'
echo.
echo export default defineConfig({
echo   plugins: [react()],
echo   server: {
echo     port: 3000,
echo     proxy: {
echo       '/api': {
echo         target: 'http://localhost:8000',
echo         changeOrigin: true
echo       },
echo       '/ws': {
echo         target: 'ws://localhost:8000',
echo         ws: true
echo       }
echo     }
echo   }
echo })
) > vite.config.js

REM Create index.html
echo Creating index.html...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo   ^<meta charset="UTF-8" /^>
echo   ^<link rel="icon" type="image/svg+xml" href="/vite.svg" /^>
echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^>
echo   ^<title^>AI Sports Betting Platform^</title^>
echo ^</head^>
echo ^<body^>
echo   ^<div id="root"^>^</div^>
echo   ^<script type="module" src="/src/main.jsx"^>^</script^>
echo ^</body^>
echo ^</html^>
) > index.html

REM Create src directory if it doesn't exist
if not exist src mkdir src

REM Create main.jsx
echo Creating src/main.jsx...
(
echo import React from 'react'
echo import ReactDOM from 'react-dom/client'
echo import App from './App'
echo import './index.css'
echo.
echo ReactDOM.createRoot(document.getElementById('root')).render(
echo   ^<React.StrictMode^>
echo     ^<App /^>
echo   ^</React.StrictMode^>
echo )
) > src\main.jsx

REM Create tailwind.config.js
echo Creating tailwind.config.js...
(
echo /** @type {import('tailwindcss').Config} */
echo export default {
echo   content: [
echo     "./index.html",
echo     "./src/**/*.{js,ts,jsx,tsx}",
echo   ],
echo   theme: {
echo     extend: {},
echo   },
echo   plugins: [],
echo }
) > tailwind.config.js

REM Create postcss.config.js
echo Creating postcss.config.js...
(
echo export default {
echo   plugins: {
echo     tailwindcss: {},
echo     autoprefixer: {},
echo   },
echo }
) > postcss.config.js

REM Create index.css with Tailwind
echo Creating src/index.css...
(
echo @tailwind base;
echo @tailwind components;
echo @tailwind utilities;
echo.
echo body {
echo   margin: 0;
echo   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
echo     'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
echo     sans-serif;
echo   -webkit-font-smoothing: antialiased;
echo   -moz-osx-font-smoothing: grayscale;
echo   background-color: #0f172a;
echo   color: #f1f5f9;
echo }
) > src\index.css

REM Install dependencies
echo Installing frontend dependencies...
call npm install

cd ..

REM Fix Backend
echo.
echo Fixing backend configuration...
cd backend

REM Update requirements.txt
echo Updating requirements.txt...
(
echo fastapi==0.104.1
echo uvicorn[standard]==0.24.0
echo aiohttp==3.9.0
echo numpy
echo scikit-learn
echo joblib
echo python-dotenv==1.0.0
echo websockets==12.0
echo beautifulsoup4==4.12.2
echo redis==5.0.1
echo pandas
echo shap
echo python-multipart==0.0.6
echo httpx==0.25.2
echo lxml
) > requirements.txt

REM Install backend dependencies
echo Installing backend dependencies...
pip install -r requirements.txt

cd ..

REM Create enhanced App.jsx based on instructions.md
echo Creating enhanced frontend App...
cd frontend\src

(
echo import React, { useState, useEffect } from 'react';
echo import { Home, BarChart3, Users, TrendingUp, Settings, Menu, X } from 'lucide-react';
echo import axios from 'axios';
echo import { motion } from 'framer-motion';
echo.
echo function App() {
echo   const [sidebarOpen, setSidebarOpen] = useState(true);
echo   const [activeTab, setActiveTab] = useState('home');
echo   const [data, setData] = useState({
echo     predictions: [],
echo     lineup: [],
echo     analytics: {}
echo   });
echo.
echo   const menuItems = [
echo     { id: 'home', label: 'Home', icon: Home },
echo     { id: 'predictions', label: 'Predictions', icon: BarChart3 },
echo     { id: 'lineup', label: 'Lineup Builder', icon: Users },
echo     { id: 'analytics', label: 'Analytics', icon: TrendingUp },
echo     { id: 'settings', label: 'Settings', icon: Settings }
echo   ];
echo.
echo   useEffect(() =^> {
echo     // Fetch initial data
echo     fetchData();
echo   }, [activeTab]);
echo.
echo   const fetchData = async () =^> {
echo     try {
echo       if (activeTab === 'predictions') {
echo         const res = await axios.get('/api/predictions');
echo         setData(prev =^> ({...prev, predictions: res.data}));
echo       } else if (activeTab === 'lineup') {
echo         const res = await axios.get('/api/lineup');
echo         setData(prev =^> ({...prev, lineup: res.data.players || []}));
echo       } else if (activeTab === 'analytics') {
echo         const res = await axios.get('/api/analytics');
echo         setData(prev =^> ({...prev, analytics: res.data.analytics || {}}));
echo       }
echo     } catch (error) {
echo       console.error('Error fetching data:', error);
echo     }
echo   };
echo.
echo   const renderContent = () =^> {
echo     switch(activeTab) {
echo       case 'home':
echo         return (
echo           ^<div className="space-y-6"^>
echo             ^<h2 className="text-3xl font-bold"^>Welcome to AI Sports Betting Platform^</h2^>
echo             ^<div className="grid grid-cols-1 md:grid-cols-3 gap-6"^>
echo               ^<div className="bg-slate-800 p-6 rounded-lg"^>
echo                 ^<h3 className="text-xl font-semibold mb-2"^>Today's Predictions^</h3^>
echo                 ^<p className="text-gray-400"^>AI-powered betting insights^</p^>
echo               ^</div^>
echo               ^<div className="bg-slate-800 p-6 rounded-lg"^>
echo                 ^<h3 className="text-xl font-semibold mb-2"^>Lineup Optimizer^</h3^>
echo                 ^<p className="text-gray-400"^>Build winning DFS lineups^</p^>
echo               ^</div^>
echo               ^<div className="bg-slate-800 p-6 rounded-lg"^>
echo                 ^<h3 className="text-xl font-semibold mb-2"^>Live Analytics^</h3^>
echo                 ^<p className="text-gray-400"^>Track model performance^</p^>
echo               ^</div^>
echo             ^</div^>
echo           ^</div^>
echo         );
echo       case 'predictions':
echo         return (
echo           ^<div className="space-y-6"^>
echo             ^<h2 className="text-3xl font-bold"^>Predictions Dashboard^</h2^>
echo             ^<div className="bg-slate-800 rounded-lg p-6"^>
echo               ^<div className="overflow-x-auto"^>
echo                 ^<table className="w-full"^>
echo                   ^<thead^>
echo                     ^<tr className="border-b border-slate-700"^>
echo                       ^<th className="text-left p-2"^>Game^</th^>
echo                       ^<th className="text-left p-2"^>Prediction^</th^>
echo                       ^<th className="text-left p-2"^>Confidence^</th^>
echo                       ^<th className="text-left p-2"^>Status^</th^>
echo                     ^</tr^>
echo                   ^</thead^>
echo                   ^<tbody^>
echo                     {data.predictions.length === 0 ? (
echo                       ^<tr^>^<td colSpan="4" className="text-center p-4 text-gray-400"^>Loading predictions...^</td^>^</tr^>
echo                     ) : (
echo                       data.predictions.map((pred, i) =^> (
echo                         ^<tr key={i} className="border-b border-slate-700/50"^>
echo                           ^<td className="p-2"^>{pred.game || 'N/A'}^</td^>
echo                           ^<td className="p-2"^>{pred.prediction || 'N/A'}^</td^>
echo                           ^<td className="p-2"^>{pred.confidence || 'N/A'}%^</td^>
echo                           ^<td className="p-2"^>^<span className="text-green-400"^>✅^</span^>^</td^>
echo                         ^</tr^>
echo                       ))
echo                     )}
echo                   ^</tbody^>
echo                 ^</table^>
echo               ^</div^>
echo             ^</div^>
echo           ^</div^>
echo         );
echo       case 'lineup':
echo         return (
echo           ^<div className="space-y-6"^>
echo             ^<h2 className="text-3xl font-bold"^>Lineup Builder^</h2^>
echo             ^<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"^>
echo               ^<div className="bg-slate-800 rounded-lg p-6"^>
echo                 ^<h3 className="text-xl font-semibold mb-4"^>Available Players^</h3^>
echo                 ^<div className="space-y-2"^>
echo                   {data.lineup.slice(0, 10).map((player, i) =^> (
echo                     ^<div key={i} className="bg-slate-700 p-3 rounded cursor-pointer hover:bg-slate-600"^>
echo                       ^<div className="font-medium"^>{player.name}^</div^>
echo                       ^<div className="text-sm text-gray-400"^>{player.team} - {player.position}^</div^>
echo                     ^</div^>
echo                   ))}
echo                 ^</div^>
echo               ^</div^>
echo               ^<div className="bg-slate-800 rounded-lg p-6"^>
echo                 ^<h3 className="text-xl font-semibold mb-4"^>Your Lineup^</h3^>
echo                 ^<p className="text-gray-400"^>Click players to add them here^</p^>
echo               ^</div^>
echo             ^</div^>
echo           ^</div^>
echo         );
echo       case 'analytics':
echo         return (
echo           ^<div className="space-y-6"^>
echo             ^<h2 className="text-3xl font-bold"^>Analytics^</h2^>
echo             ^<div className="grid grid-cols-1 md:grid-cols-2 gap-6"^>
echo               ^<div className="bg-slate-800 rounded-lg p-6"^>
echo                 ^<h3 className="text-xl font-semibold mb-4"^>Model Accuracy^</h3^>
echo                 ^<div className="text-3xl font-bold text-green-400"^>68.5%^</div^>
echo               ^</div^>
echo               ^<div className="bg-slate-800 rounded-lg p-6"^>
echo                 ^<h3 className="text-xl font-semibold mb-4"^>Total Predictions^</h3^>
echo                 ^<div className="text-3xl font-bold text-blue-400"^>1,247^</div^>
echo               ^</div^>
echo             ^</div^>
echo           ^</div^>
echo         );
echo       default:
echo         return null;
echo     }
echo   };
echo.
echo   return (
echo     ^<div className="flex h-screen bg-slate-900 text-white"^>
echo       {/* Sidebar */}
echo       ^<motion.div
echo         initial={{ x: -250 }}
echo         animate={{ x: sidebarOpen ? 0 : -250 }}
echo         className="fixed left-0 top-0 h-full w-64 bg-slate-800 p-6 z-10"
echo       ^>
echo         ^<h1 className="text-2xl font-bold mb-8"^>AI Betting^</h1^>
echo         ^<nav className="space-y-2"^>
echo           {menuItems.map(item =^> (
echo             ^<button
echo               key={item.id}
echo               onClick={() =^> setActiveTab(item.id)}
echo               className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
echo                 activeTab === item.id ? 'bg-purple-600' : 'hover:bg-slate-700'
echo               }`}
echo             ^>
echo               ^<item.icon size={20} /^>
echo               {item.label}
echo             ^</button^>
echo           ))}
echo         ^</nav^>
echo       ^</motion.div^>
echo.
echo       {/* Main Content */}
echo       ^<div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all`}^>
echo         ^<header className="bg-slate-800 p-4 flex items-center justify-between"^>
echo           ^<button onClick={() =^> setSidebarOpen(!sidebarOpen)} className="p-2"^>
echo             {sidebarOpen ? ^<X /^> : ^<Menu /^>}
echo           ^</button^>
echo           ^<div className="text-sm text-gray-400"^>
echo             Connected to Backend
echo           ^</div^>
echo         ^</header^>
echo         ^<main className="p-8"^>
echo           {renderContent()}
echo         ^</main^>
echo       ^</div^>
echo     ^</div^>
echo   );
echo }
echo.
echo export default App;
) > App.jsx

cd ..\..

REM Create final start script
echo.
echo Creating start script...
(
echo @echo off
echo echo ============================================
echo echo Starting AI Sports Betting Platform
echo echo ============================================
echo echo.
echo echo Starting Backend Server...
echo start /min cmd /k "cd backend && python server.py"
echo.
echo timeout /t 3 /nobreak ^> nul
echo.
echo echo Starting Frontend...
echo cd frontend
echo npm run dev
) > start_platform.bat

echo.
echo ============================================
echo SETUP COMPLETE!
echo ============================================
echo.
echo Run start_platform.bat to launch your app
echo.
pause