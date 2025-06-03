from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.prediction import Prediction
from schemas.prediction import PredictionCreate, PredictionResponse

router = APIRouter()

@router.post("/", response_model=PredictionResponse)
async def create_prediction(
    prediction: PredictionCreate,
    db: Session = Depends(get_db)
):
    # Implementation here
    pass

@router.get("/", response_model=List[PredictionResponse])
async def get_predictions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    # Implementation here
    pass
