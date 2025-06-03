from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime
import logging
from ..services.monitoring_service import monitoring_service

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

class PerformanceMetric(BaseModel):
    name: str
    value: float
    timestamp: datetime

class PerformanceReport(BaseModel):
    timestamp: datetime
    metrics: Dict[str, Dict[str, float]]

@router.post("/performance")
async def record_performance(report: PerformanceReport):
    try:
        await monitoring_service.record_performance(report)
        return {"status": "success", "message": "Performance data recorded successfully"}
    except Exception as e:
        logging.error(f"Error recording performance data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to record performance data")

@router.get("/performance/summary")
async def get_performance_summary(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    metric_name: Optional[str] = None
):
    try:
        summary = await monitoring_service.get_performance_summary(
            start_time=start_time,
            end_time=end_time,
            metric_name=metric_name
        )
        return summary
    except Exception as e:
        logging.error(f"Error retrieving performance summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve performance summary")

@router.get("/performance/alerts")
async def get_performance_alerts():
    try:
        alerts = await monitoring_service.get_performance_alerts()
        return alerts
    except Exception as e:
        logging.error(f"Error retrieving performance alerts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve performance alerts")

@router.get("/performance/trends")
async def get_performance_trends(
    metric_name: str,
    interval: str = "1h",
    limit: int = 24
):
    try:
        trends = await monitoring_service.get_performance_trends(
            metric_name=metric_name,
            interval=interval,
            limit=limit
        )
        return trends
    except Exception as e:
        logging.error(f"Error retrieving performance trends: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve performance trends") 