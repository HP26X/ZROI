from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import datetime
import uuid

from app.models import ROIInputs, ROICalculationResult, CampaignSnapshot, ChannelType, ChannelBenchmark
from app.roi_engine import calculate_roi, CHANNEL_BENCHMARKS

app = FastAPI(
    title="ZROI API Engine",
    description="Live Event ROI Forecasting & Analytics API for Brands and Media Buyers",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for saved campaign snapshots
snapshots_db: Dict[str, CampaignSnapshot] = {}

@app.get("/")
def read_root():
    return {
        "app": "ZROI Engine",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/benchmarks", response_model=Dict[str, ChannelBenchmark])
def get_channel_benchmarks():
    """Retrieve pre-configured baseline channel benchmarks and algorithms."""
    return CHANNEL_BENCHMARKS

@app.post("/api/calculate", response_model=ROICalculationResult)
def calculate_roi_endpoint(inputs: ROIInputs):
    """Calculate real-time ROI, revenues, impressions, and timeline projections."""
    return calculate_roi(inputs)

@app.get("/api/snapshots", response_model=List[CampaignSnapshot])
def list_snapshots():
    """List all saved campaign snapshots."""
    return list(snapshots_db.values())

@app.post("/api/snapshots", response_model=CampaignSnapshot)
def save_snapshot(inputs: ROIInputs):
    """Save current input parameters and calculation results as a snapshot."""
    calc_result = calculate_roi(inputs)
    snapshot_id = str(uuid.uuid4())[:8]
    snapshot = CampaignSnapshot(
        id=snapshot_id,
        title=f"{inputs.campaign_name} ({inputs.channel_type.replace('_', ' ').title()})",
        created_at=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        inputs=inputs,
        result=calc_result
    )
    snapshots_db[snapshot_id] = snapshot
    return snapshot

@app.delete("/api/snapshots/{snapshot_id}")
def delete_snapshot(snapshot_id: str):
    """Delete a saved snapshot by ID."""
    if snapshot_id in snapshots_db:
        del snapshots_db[snapshot_id]
        return {"status": "deleted", "id": snapshot_id}
    raise HTTPException(status_code=404, detail="Snapshot not found")
