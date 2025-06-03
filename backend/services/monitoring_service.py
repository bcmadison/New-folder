from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging
from pydantic import BaseModel
import asyncio
from ..database import get_database
from ..config import settings

class PerformanceData(BaseModel):
    timestamp: datetime
    metrics: Dict[str, Dict[str, float]]

class PerformanceAlert(BaseModel):
    metric_name: str
    threshold: float
    current_value: float
    timestamp: datetime
    severity: str

class MonitoringService:
    def __init__(self):
        self.db = get_database()
        self.alert_thresholds = {
            "response_time": 1000,  # ms
            "error_rate": 0.01,     # 1%
            "cpu_usage": 80,        # percentage
            "memory_usage": 80,     # percentage
        }
        self.alert_severities = {
            "response_time": {
                "warning": 500,     # ms
                "critical": 1000,   # ms
            },
            "error_rate": {
                "warning": 0.005,   # 0.5%
                "critical": 0.01,   # 1%
            },
        }

    async def record_performance(self, data: PerformanceData) -> None:
        try:
            # Store raw performance data
            await self.db.performance.insert_one(data.dict())
            
            # Check for alerts
            alerts = await self._check_alerts(data)
            if alerts:
                await self._store_alerts(alerts)
            
            # Update aggregated metrics
            await self._update_aggregated_metrics(data)
            
        except Exception as e:
            logging.error(f"Error recording performance data: {str(e)}")
            raise

    async def get_performance_summary(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        metric_name: Optional[str] = None
    ) -> Dict:
        try:
            query = {}
            if start_time:
                query["timestamp"] = {"$gte": start_time}
            if end_time:
                query["timestamp"] = {"$lte": end_time}
            if metric_name:
                query[f"metrics.{metric_name}"] = {"$exists": True}

            pipeline = [
                {"$match": query},
                {"$group": {
                    "_id": None,
                    "avg_metrics": {"$avg": "$metrics"},
                    "max_metrics": {"$max": "$metrics"},
                    "min_metrics": {"$min": "$metrics"},
                    "count": {"$sum": 1}
                }}
            ]

            result = await self.db.performance.aggregate(pipeline).to_list(1)
            return result[0] if result else {}

        except Exception as e:
            logging.error(f"Error getting performance summary: {str(e)}")
            raise

    async def get_performance_alerts(self) -> List[PerformanceAlert]:
        try:
            # Get alerts from the last hour
            start_time = datetime.utcnow() - timedelta(hours=1)
            alerts = await self.db.alerts.find({
                "timestamp": {"$gte": start_time}
            }).to_list(None)
            
            return [PerformanceAlert(**alert) for alert in alerts]

        except Exception as e:
            logging.error(f"Error getting performance alerts: {str(e)}")
            raise

    async def get_performance_trends(
        self,
        metric_name: str,
        interval: str = "1h",
        limit: int = 24
    ) -> List[Dict]:
        try:
            # Convert interval to seconds
            interval_seconds = self._parse_interval(interval)
            
            # Calculate time range
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(seconds=interval_seconds * limit)
            
            pipeline = [
                {
                    "$match": {
                        "timestamp": {"$gte": start_time, "$lte": end_time},
                        f"metrics.{metric_name}": {"$exists": True}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "$dateTrunc": {
                                "date": "$timestamp",
                                "unit": "hour",
                                "binSize": interval_seconds // 3600
                            }
                        },
                        "avg_value": {"$avg": f"$metrics.{metric_name}"},
                        "max_value": {"$max": f"$metrics.{metric_name}"},
                        "min_value": {"$min": f"$metrics.{metric_name}"}
                    }
                },
                {"$sort": {"_id": 1}},
                {"$limit": limit}
            ]
            
            results = await self.db.performance.aggregate(pipeline).to_list(None)
            return results

        except Exception as e:
            logging.error(f"Error getting performance trends: {str(e)}")
            raise

    async def _check_alerts(self, data: PerformanceData) -> List[PerformanceAlert]:
        alerts = []
        for metric_name, values in data.metrics.items():
            if metric_name in self.alert_severities:
                current_value = values.get("value", 0)
                thresholds = self.alert_severities[metric_name]
                
                if current_value >= thresholds["critical"]:
                    alerts.append(PerformanceAlert(
                        metric_name=metric_name,
                        threshold=thresholds["critical"],
                        current_value=current_value,
                        timestamp=data.timestamp,
                        severity="critical"
                    ))
                elif current_value >= thresholds["warning"]:
                    alerts.append(PerformanceAlert(
                        metric_name=metric_name,
                        threshold=thresholds["warning"],
                        current_value=current_value,
                        timestamp=data.timestamp,
                        severity="warning"
                    ))
        
        return alerts

    async def _store_alerts(self, alerts: List[PerformanceAlert]) -> None:
        try:
            await self.db.alerts.insert_many([alert.dict() for alert in alerts])
        except Exception as e:
            logging.error(f"Error storing alerts: {str(e)}")
            raise

    async def _update_aggregated_metrics(self, data: PerformanceData) -> None:
        try:
            # Update hourly aggregates
            hour_start = data.timestamp.replace(minute=0, second=0, microsecond=0)
            
            for metric_name, values in data.metrics.items():
                await self.db.aggregated_metrics.update_one(
                    {
                        "metric_name": metric_name,
                        "hour": hour_start
                    },
                    {
                        "$inc": {
                            "count": 1,
                            "sum": values.get("value", 0)
                        },
                        "$max": {"max": values.get("value", 0)},
                        "$min": {"min": values.get("value", 0)}
                    },
                    upsert=True
                )
        except Exception as e:
            logging.error(f"Error updating aggregated metrics: {str(e)}")
            raise

    def _parse_interval(self, interval: str) -> int:
        """Convert interval string (e.g., '1h', '30m') to seconds"""
        unit = interval[-1]
        value = int(interval[:-1])
        
        if unit == 's':
            return value
        elif unit == 'm':
            return value * 60
        elif unit == 'h':
            return value * 3600
        elif unit == 'd':
            return value * 86400
        else:
            raise ValueError(f"Invalid interval unit: {unit}")

# Create singleton instance
monitoring_service = MonitoringService() 