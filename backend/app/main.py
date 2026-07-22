from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import incidents, hotspots, network, predictive, anomalies, live, dispatch
app = FastAPI(title="SENTINEL API", description="AI-Driven Crime Analytics Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents.router)
app.include_router(hotspots.router)
app.include_router(network.router)
app.include_router(predictive.router)
app.include_router(anomalies.router)
app.include_router(live.router)
app.include_router(dispatch.router)

@app.get("/")
def read_root():
    return {"status": "SENTINEL API is running"}
