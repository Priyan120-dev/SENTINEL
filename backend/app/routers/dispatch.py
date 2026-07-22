from fastapi import APIRouter, Depends, HTTPException, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import math
import json
import asyncio

from app.db import get_db
from app.models import Officer, OfficerStatus, Station
from app.routers.live import active_connections

router = APIRouter(prefix="/dispatch", tags=["dispatch"])

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon / 2) * math.sin(dLon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance

class DispatchConfirmRequest(BaseModel):
    officer_id: int
    event_id: int

class DispatchOfficerResponse(BaseModel):
    officer_id: int
    name: str
    badge_number: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    distance_km: float
    rank_score: float

    class Config:
        from_attributes = True

async def broadcast_dispatch_update(update_data: dict):
    message = json.dumps({
        "type": "DISPATCH_UPDATE",
        **update_data
    })
    disconnected = []
    for connection in active_connections:
        try:
            await connection.send_text(message)
        except WebSocketDisconnect:
            disconnected.append(connection)
        except Exception:
            disconnected.append(connection)
            
    for connection in disconnected:
        if connection in active_connections:
            active_connections.remove(connection)

@router.get("/officers", response_model=List[DispatchOfficerResponse])
def get_officers(hotspot_lat: float, hotspot_lon: float, severity: int, db: Session = Depends(get_db)):
    # Find closest station's district
    stations = db.query(Station).all()
    closest_station = None
    min_station_dist = float('inf')
    
    for station in stations:
        if station.lat is None or station.lon is None:
            continue
        st_dist = haversine(hotspot_lat, hotspot_lon, station.lat, station.lon)
        if st_dist < min_station_dist:
            min_station_dist = st_dist
            closest_station = station
            
    hotspot_district_id = closest_station.district_id if closest_station else None

    officers = db.query(Officer).filter(Officer.status == OfficerStatus.AVAILABLE).all()
    
    results = []
    for officer in officers:
        if officer.lat is None or officer.lon is None:
            continue
            
        dist = haversine(hotspot_lat, hotspot_lon, officer.lat, officer.lon)
        
        penalty = 0.0
        if hotspot_district_id is not None and officer.district_id != hotspot_district_id:
            penalty = 5.0 / max(severity, 1)
            
        rank_score = dist + penalty
        
        results.append({
            "officer_id": officer.officer_id,
            "name": officer.name,
            "badge_number": officer.badge_number,
            "lat": officer.lat,
            "lon": officer.lon,
            "distance_km": dist,
            "rank_score": rank_score
        })
    
    results.sort(key=lambda x: x["rank_score"])
    
    return results

@router.post("/confirm")
async def confirm_dispatch(request: DispatchConfirmRequest, db: Session = Depends(get_db)):
    officer = db.query(Officer).filter(Officer.officer_id == request.officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
        
    if officer.status != OfficerStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"Officer not available (current status: {officer.status})")
        
    officer.status = OfficerStatus.DISPATCHED
    db.commit()
    
    update_data = {
        "action": "CONFIRM",
        "officer_id": request.officer_id,
        "event_id": request.event_id,
        "status": "DISPATCHED",
        "message": f"Officer {officer.name} dispatched to event {request.event_id}"
    }
    
    await broadcast_dispatch_update(update_data)
    
    return {"message": "Dispatch confirmed", "officer_id": request.officer_id}

@router.post("/acknowledge")
async def acknowledge_dispatch(request: DispatchConfirmRequest, db: Session = Depends(get_db)):
    officer = db.query(Officer).filter(Officer.officer_id == request.officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
        
    update_data = {
        "action": "ACKNOWLEDGE",
        "officer_id": request.officer_id,
        "event_id": request.event_id,
        "message": f"Officer {officer.name} acknowledged dispatch to event {request.event_id}"
    }
    
    await broadcast_dispatch_update(update_data)
    
    return {"message": "Dispatch acknowledged", "officer_id": request.officer_id}
