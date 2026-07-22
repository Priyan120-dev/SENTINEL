from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN

from .. import models
from ..db import get_db

router = APIRouter(prefix="/api/hotspots", tags=["hotspots"])

@router.get("/")
def get_hotspots(
    district_id: Optional[int] = None,
    window_days: int = 30,
    eps_km: float = 0.5,
    min_samples: int = 8,
    db: Session = Depends(get_db)
):
    query = db.query(models.CrimeEvent.lat, models.CrimeEvent.lon)
    
    if district_id:
        query = query.filter(models.CrimeEvent.district_id == district_id)
        
    date_from = datetime.utcnow() - timedelta(days=window_days)
    # Use real dates for the demo, or just pull last N events if dates are spread out
    # Synthetic generator spread dates over 1 year. To ensure we have hotspots, we'll just ignore the time window for the demo or pull last 1 year.
    query = query.filter(models.CrimeEvent.occurred_at >= date_from)
    
    results = query.all()
    if not results:
        return []
        
    df = pd.DataFrame(results, columns=["lat", "lon"])
    
    coords = np.radians(df[["lat", "lon"]].values)
    # DBSCAN using haversine metric (eps is in radians, so divide by earth radius in km)
    db_scan = DBSCAN(eps=eps_km/6371, min_samples=min_samples, metric="haversine").fit(coords)
    df["cluster"] = db_scan.labels_
    
    # Calculate cluster centers and sizes
    hotspots_df = df[df.cluster != -1].groupby("cluster").agg(
        lat=("lat", "mean"),
        lon=("lon", "mean"),
        count=("cluster", "size")
    ).reset_index()
    
    return hotspots_df.to_dict(orient="records")
