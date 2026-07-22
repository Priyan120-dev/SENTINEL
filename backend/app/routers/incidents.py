from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from .. import models, schemas
from ..db import get_db

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

@router.get("/", response_model=List[schemas.CrimeEventBase])
def get_incidents(
    district_id: Optional[int] = None,
    crime_type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    query = db.query(models.CrimeEvent)
    
    if district_id:
        query = query.filter(models.CrimeEvent.district_id == district_id)
    if crime_type:
        query = query.filter(models.CrimeEvent.crime_type == crime_type)
    if date_from:
        query = query.filter(models.CrimeEvent.occurred_at >= date_from)
    if date_to:
        query = query.filter(models.CrimeEvent.occurred_at <= date_to)
        
    # Return top N incidents to avoid huge payloads during dashboard load
    return query.order_by(models.CrimeEvent.occurred_at.desc()).limit(limit).all()

@router.get("/districts")
def get_districts(db: Session = Depends(get_db)):
    districts = db.query(models.District).all()
    # Manual serialization since geom was changed to string
    res = []
    for d in districts:
        # We stored geom as WKT in SQLite (MULTIPOLYGON(...))
        # Just return basic info + center for the dashboard dropdowns
        # In SQLite fallback we used rough center in generate_data which isn't stored in District,
        # but we can get it from stations or simply return the ID/Name
        # Wait, I didn't store lat/lon in District, I stored a WKT. Let's just parse the WKT rough center if needed,
        # or we just get the first station's coords.
        st = db.query(models.Station).filter(models.Station.district_id == d.district_id).first()
        lat = st.lat if st else 15.0
        lon = st.lon if st else 76.0
        res.append({"district_id": d.district_id, "name": d.name, "population": d.population, "lat": lat, "lon": lon})
    return res
