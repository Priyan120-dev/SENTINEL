import asyncio
import json
import random
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(
    prefix="/ws",
    tags=["live"]
)

# Active connections
active_connections = []

CRIME_TYPES = [
    "ASSAULT", "BURGLARY", "NARCOTICS", "CYBER_FRAUD", 
    "VEHICLE_THEFT", "ROBBERY", "EXTORTION", "RIOT"
]

async def generate_live_events():
    while True:
        await asyncio.sleep(5)  # Generate an event every 5 seconds
        if not active_connections:
            continue

        # Simulate a high-severity incident in Karnataka
        lat = random.uniform(11.5, 18.5)
        lon = random.uniform(74.0, 78.5)
        severity = random.randint(3, 5) # Only critical/high alerts
        
        event = {
            "event_id": random.randint(100000, 999999),
            "crime_type": random.choice(CRIME_TYPES),
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "lat": lat,
            "lon": lon,
            "status": "OPEN",
            "severity": severity,
            "district_id": random.randint(1, 31) # Assuming 31 districts
        }
        
        message = json.dumps(event)
        
        # Broadcast to all connected clients
        disconnected = []
        for connection in active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
                
        for connection in disconnected:
            active_connections.remove(connection)

# Start the background task (we'll ensure it only runs once)
bg_task = None

@router.websocket("/live-incidents")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    
    global bg_task
    if bg_task is None:
        bg_task = asyncio.create_task(generate_live_events())
        
    try:
        while True:
            # We don't expect the client to send anything, but we need to keep the connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)
