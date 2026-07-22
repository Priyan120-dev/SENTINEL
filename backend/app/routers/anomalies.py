from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from .. import models
from ..db import get_db

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])

@router.get("/")
def get_anomalies(
    district_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Simulated Anomaly Detection using Z-Score on daily counts
    query = db.query(models.CrimeEvent.crime_type, models.CrimeEvent.occurred_at, models.CrimeEvent.severity)
    if district_id:
        query = query.filter(models.CrimeEvent.district_id == district_id)
        
    results = query.all()
    if not results:
        return []
        
    df = pd.DataFrame(results, columns=["crime_type", "date", "severity"])
    df['day'] = pd.to_datetime(df['date']).dt.floor('d')
    
    # Count crimes per day per type
    daily_counts = df.groupby(['day', 'crime_type']).size().reset_index(name='count')
    
    anomalies = []
    
    # Calculate Z-score for each crime type
    for c_type in daily_counts['crime_type'].unique():
        type_df = daily_counts[daily_counts['crime_type'] == c_type]
        if len(type_df) < 5: continue
        
        mean = type_df['count'].mean()
        std = type_df['count'].std()
        if std == 0: continue
        
        # Get the latest day for this crime type
        latest_day = type_df['day'].max()
        latest_count = type_df[type_df['day'] == latest_day]['count'].values[0]
        
        z_score = (latest_count - mean) / std
        
        # If z-score is high, flag it as an anomaly
        if z_score > 2.0:
            anomalies.append({
                "id": f"anom-{c_type}-{latest_day.date()}",
                "crime_type": c_type,
                "date": latest_day.isoformat(),
                "z_score": round(z_score, 2),
                "current_count": int(latest_count),
                "average": round(mean, 2),
                "message": f"Unusual spike detected in {c_type.replace('_', ' ')}. Z-Score: {z_score:.2f} (Count: {latest_count}, Avg: {mean:.1f})"
            })
            
    # Also find recent high severity events
    recent_severe = df[df['severity'] == 5].sort_values('date', ascending=False).head(5)
    for _, row in recent_severe.iterrows():
        anomalies.append({
            "id": f"sev-{row['crime_type']}-{row['date'].date()}-{np.random.randint(1000)}",
            "crime_type": row['crime_type'],
            "date": row['date'].isoformat(),
            "severity": 5,
            "message": f"Critical severity {row['crime_type'].replace('_', ' ')} incident reported."
        })
            
    return anomalies
