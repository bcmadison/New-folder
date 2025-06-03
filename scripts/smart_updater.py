import io
from pathlib import Path

code_map = {
    "backend/routes/settings.py": '''from fastapi import APIRouter

router = APIRouter()

@router.get("/api/settings")
async def get_settings():
    return {
        "social_sentiment_enabled": True,
        "volatility_detection": True,
        "prediction_confidence_threshold": 0.75
    }''',

    "backend/routes/analytics_route.py": '''from fastapi import APIRouter

router = APIRouter()

@router.get("/api/analytics")
async def get_analytics():
    return {
        "roi": 0.124,
        "model_accuracy": 0.72,
        "value_bet_success": 0.68,
        "top_players": ["Jokic", "Judge", "McDavid"]
    }''',

    "backend/server.py": '''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.lineup import router as lineup_router
from routes.settings import router as settings_router
from routes.analytics_route import router as analytics_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lineup_router)
app.include_router(settings_router)
app.include_router(analytics_router)

@app.get("/")
async def root():
    return {"message": "AI Sports Betting Backend is live."}''',

    "frontend/src/pages/HomePage.jsx": '''import React from 'react';
const HomePage = () => <div className="text-xl">🏠 Welcome to AI Sports Betting!</div>;
export default HomePage;''',

    "frontend/src/pages/AnalyticsPage.jsx": '''import React from 'react';
const AnalyticsPage = () => <div className="text-xl">📊 Analytics Dashboard</div>;
export default AnalyticsPage;''',

    "frontend/src/pages/SettingsPage.jsx": '''import React from 'react';
const SettingsPage = () => <div className="text-xl">⚙️ Settings</div>;
export default SettingsPage;''',

    "frontend/src/components/SmartControlsBar.jsx": '''import React from 'react';
const SmartControlsBar = () => <div className="p-2 bg-gray-100">Smart controls go here</div>;
export default SmartControlsBar;'''
}

for rel_path, code in code_map.items():
    abs_path = Path(rel_path)
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    with io.open(abs_path, "w", encoding="utf-8") as f:
        f.write(code.strip())

print("✅ UTF-8 safe updater complete. All components restored.")