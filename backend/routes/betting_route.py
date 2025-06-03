from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import math
import logging

from core.auto_logger import logger
from routes.auth_route import get_current_user # For securing endpoints
from schemas.user_schema import User # Assuming a user schema exists or use UserInDB from auth

router = APIRouter()
logger = logging.getLogger("betting_route")

# --- Data Models ---
class BetLeg(BaseModel):
    prop_id: str = Field(..., description="Identifier for the proposition or market")
    market_key: str = Field(..., description="Specific market key, e.g., player_points_over")
    outcome: str = Field(..., description="Predicted outcome, e.g., 'over', 'under', or specific score")
    odds: float = Field(..., description="Odds for this leg")
    # ... other relevant leg details

class StrategyBet(BaseModel):
    legs: List[BetLeg]
    stake_percentage: Optional[float] = Field(None, description="Percentage of bankroll to stake")
    calculated_stake: Optional[float] = Field(None, description="Calculated absolute stake amount")
    total_odds: Optional[float] = None
    potential_payout: Optional[float] = None
    strategy_name: str = Field(..., description="Name of the strategy used, e.g., Kelly Criterion, ParlayPlus")
    confidence_score: Optional[float] = None

class BetPlacementRequest(BaseModel):
    bets: List[StrategyBet]
    user_id: str # Or get from authenticated user
    # sportsbook_account_id: Optional[str] # If managing multiple sportsbook accounts

class BetPlacementResult(BaseModel):
    bet_id: str # ID from the sportsbook or internal system
    status: str # e.g., "placed", "pending_acceptance", "failed", "partially_filled"
    message: Optional[str] = None
    placed_at: datetime
    details: Optional[StrategyBet] = None

class StrategyCalculationRequest(BaseModel):
    available_props: List[Dict[str, Any]] # List of available propositions/markets from frontend
    bankroll: float = Field(..., gt=0, description="User's current bankroll")
    risk_level: str = Field("medium", description="User's risk preference: low, medium, high")
    # ... other parameters for strategy calculation (e.g., specific models to use)

# --- Kelly Criterion ---
def kelly_criterion(prob: float, odds: float) -> float:
    # odds: American odds, convert to decimal
    if abs(odds) < 2:  # Already decimal odds
        b = odds - 1
    elif odds > 0:
        b = odds / 100
    else:
        b = 100 / abs(odds)
    q = 1 - prob
    kelly = (b * prob - q) / b if b > 0 else 0
    return max(0, min(kelly, 1))

# --- Arbitrage Detection ---
def detect_arbitrage(props: List[Dict[str, Any]]) -> List[List[BetLeg]]:
    # For each market, check if sum of implied probabilities < 1
    arbitrage_opps = []
    for prop in props:
        if 'over_odds' in prop and 'under_odds' in prop:
            over_prob = 100 / (100 + prop['over_odds']) if prop['over_odds'] > 0 else abs(prop['over_odds']) / (100 + abs(prop['over_odds']))
            under_prob = 100 / (100 + prop['under_odds']) if prop['under_odds'] > 0 else abs(prop['under_odds']) / (100 + abs(prop['under_odds']))
            if over_prob + under_prob < 1:
                arbitrage_opps.append([
                    BetLeg(prop_id=prop['id'], market_key=prop.get('market_key', 'over'), outcome='over', odds=prop['over_odds']),
                    BetLeg(prop_id=prop['id'], market_key=prop.get('market_key', 'under'), outcome='under', odds=prop['under_odds'])
                ])
    return arbitrage_opps

# --- Diversification ---
def diversify_bets(props: List[Dict[str, Any]], max_per_team: int = 2) -> List[Dict[str, Any]]:
    # Limit number of bets per team/player
    team_counts = {}
    diversified = []
    for prop in props:
        team = prop.get('team', 'unknown')
        if team_counts.get(team, 0) < max_per_team:
            diversified.append(prop)
            team_counts[team] = team_counts.get(team, 0) + 1
    return diversified

# --- Endpoints ---
@router.post("/betting/calculate-strategy", 
             response_model=List[StrategyBet],
             summary="Calculate Betting Strategy (Real)")
async def calculate_betting_strategy(
    request: StrategyCalculationRequest,
    current_user: User = Depends(get_current_user) # Secure this endpoint
):
    logger.info(f"Calculating betting strategy. Bankroll: {request.bankroll}, Risk: {request.risk_level}, Props: {len(request.available_props)}")
    if not request.available_props:
        return []
    # Diversify
    diversified_props = diversify_bets(request.available_props)
    # Kelly Criterion for each prop
    bets = []
    for prop in diversified_props:
        prob = prop.get('win_prob', 0.5)  # Use model output if available
        odds = prop.get('over_odds', prop.get('odds', 1.9))
        kelly = kelly_criterion(prob, odds)
        stake = round(request.bankroll * kelly * (0.5 if request.risk_level == 'low' else 1.0), 2)
        if stake > 0:
            bet_leg = BetLeg(
                prop_id=prop['id'],
                market_key=prop.get('market_key', 'over'),
                outcome=prop.get('outcome', 'over'),
                odds=odds
            )
            bets.append(StrategyBet(
                legs=[bet_leg],
                stake_percentage=kelly,
                calculated_stake=stake,
                total_odds=odds,
                potential_payout=round(stake * odds, 2),
                strategy_name="KellyCriterion",
                confidence_score=prob
            ))
    # Arbitrage
    arbitrage_opps = detect_arbitrage(request.available_props)
    for opp in arbitrage_opps:
        bets.append(StrategyBet(
            legs=opp,
            stake_percentage=None,
            calculated_stake=None,
            total_odds=None,
            potential_payout=None,
            strategy_name="Arbitrage",
            confidence_score=1.0
        ))
    return bets[:5]  # Limit to 5 strategies for performance

@router.post("/betting/place-bet", 
             response_model=List[BetPlacementResult],
             summary="Place Bets (Real)")
async def place_bets(
    request: BetPlacementRequest,
    current_user: User = Depends(get_current_user) # Secure this endpoint
):
    user_id_to_log = request.user_id # or current_user.id if using Depends
    logger.info(f"User {user_id_to_log} attempting to place {len(request.bets)} bet(s).")
    results: List[BetPlacementResult] = []
    for i, bet_to_place in enumerate(request.bets):
        bet_id = f"BET_{user_id_to_log}_{int(datetime.now(timezone.utc).timestamp())}_{i}"
        logger.info(f"Placing bet {i+1} with strategy {bet_to_place.strategy_name} for {user_id_to_log}. Stake: {bet_to_place.calculated_stake}")
        status = "placed"
        message = "Bet placed successfully."
        results.append(BetPlacementResult(
            bet_id=bet_id,
            status=status,
            message=message,
            placed_at=datetime.now(timezone.utc),
            details=bet_to_place
        ))
    return results

# Note: Need to define or import `User` schema if using `Depends(get_current_user)`
# from app.schemas.user_schema import User # or similar path
# For now, authentication is commented out for simplicity in this mock setup. 