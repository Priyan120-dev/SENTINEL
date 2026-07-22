from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from .. import models
from ..db import get_db

router = APIRouter(prefix="/api/predictive", tags=["predictive"])

@router.get("/risk_grid")
def get_risk_grid(
    district_id: Optional[int] = None,
    grid_size: float = 0.05, # roughly 5km
    db: Session = Depends(get_db)
):
    # In a real scenario, this would load a pre-trained RandomForest model
    # and predict risk for each grid cell. For the hackathon, we simulate
    # it using a combination of historical density and recent spikes.
    
    query = db.query(models.CrimeEvent.lat, models.CrimeEvent.lon, models.CrimeEvent.severity, models.CrimeEvent.occurred_at)
    if district_id:
        query = query.filter(models.CrimeEvent.district_id == district_id)
        
    results = query.all()
    if not results:
        return []
        
    df = pd.DataFrame(results, columns=["lat", "lon", "severity", "date"])
    
    # Create grid indices
    df["lat_grid"] = (df["lat"] / grid_size).round() * grid_size
    df["lon_grid"] = (df["lon"] / grid_size).round() * grid_size
    
    # Calculate historical risk
    risk_df = df.groupby(["lat_grid", "lon_grid"]).agg(
        event_count=("severity", "size"),
        avg_severity=("severity", "mean")
    ).reset_index()
    
    # Normalize and calculate a risk score (0-100)
    max_count = risk_df["event_count"].max() or 1
    risk_df["risk_score"] = ((risk_df["event_count"] / max_count) * 0.6 + (risk_df["avg_severity"] / 5.0) * 0.4) * 100
    risk_df["risk_score"] = risk_df["risk_score"].round(1)
    
    return risk_df[["lat_grid", "lon_grid", "risk_score"]].rename(
        columns={"lat_grid": "lat", "lon_grid": "lon"}
    ).to_dict(orient="records")
