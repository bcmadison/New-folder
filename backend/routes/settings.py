from fastapi import APIRouter
from typing import Dict, Any
import os

router = APIRouter()

@router.get("/config/app", summary="Get Application Configuration")
async def get_application_configuration() -> Dict[str, Any]:
    """
    Provides the main application configuration, including feature flags,
    API endpoints (can be relative or absolute if served behind a gateway),
    and other operational parameters.
    """
    # These would typically come from a more robust config management system
    # (e.g., environment variables, a config file, or a config service)
    # For now, providing static examples aligned with frontend expectations.
    return {
        "version": os.getenv("APP_VERSION", "0.1.0-backend"),
        "appName": os.getenv("APP_NAME", "AI Sports Betting Analytics Platform"),
        "environment": os.getenv("ENVIRONMENT", "development"),
        "featureFlags": {
            "newDashboardLayout": True,
            "advancedAnalytics": False, # Example: feature not yet live
            "realtimePriceUpdates": True,
            "enableExperimentalOddsCalculation": False,
            "showAdvancedAnalyticsDashboard": True,
            "useNewSentimentModel": False,
        },
        "experiments": [
            # {
            #   "id": "exp_dashboard_layout_v2",
            #   "name": "Dashboard Layout V2 Test",
            #   "variants": [
            #     { "id": "control", "name": "Current Layout", "weight": 50 },
            #     { "id": "variant_a", "name": "New V2 Layout", "weight": 50 },
            #   ],
            #   "isActive": False, # Example: experiment not active
            # },
        ],
        "apiEndpoints": {
            "users": "/api/users",
            "prizepicks": "/api/prizepicks",
            "predictions": "/api/predictions",
            "dataScraping": "/api/data-scraping",
            "config": "/api/config",
            "news": "/api/news",
            "sentiment": "/api/sentiment",
            "bettingStrategy": "/api/betting",
            "auth": "/api/auth",
            "live": "/api/live"
        },
        "bettingLimits": {
            "maxStakeSingle": 1000,
            "maxStakeParlay": 500,
            "maxPayout": 10000,
            "minLegsParlay": 2,
            "maxLegsParlay": 8,
        },
        "sentryDsn": os.getenv("SENTRY_DSN_BACKEND", ""), # Backend specific Sentry
        "logLevel": os.getenv("LOG_LEVEL", "info"),
        # Add other configurations as needed by UnifiedConfig on frontend
        "appTitle": os.getenv("APP_TITLE", "AI BetBot")
    }

# The /api/prizepicks endpoint from the original settings.py
# will be moved and consolidated, likely into lineup.py or a new prizepicks_route.py
# to handle /api/prizepicks/projections etc. as expected by the frontend.

# Removed the old /api/settings endpoint which returned a different structure.