from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class PredictionRequest(BaseModel):
    team1: str
    team2: str

@router.post("/predict")
async def predict(request: PredictionRequest):
    try:
        # Dummy prediction logic
        if request.team1 == "Lakers" and request.team2 == "Warriors":
            return {"prediction": "Lakers will win!"}
        else:
            return {"prediction": "Match result uncertain."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
