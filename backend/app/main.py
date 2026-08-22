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

# Pre-populated demo scenarios
DEMO_CAMPAIGNS = [
    ROIInputs(
        campaign_name="Summer Esports Championship",
        channel_type=ChannelType.TWITCH,
        initial_ad_spend=35000.0,
        peak_viewership=120000,
        avg_viewership=65000,
        broadcast_duration_hours=5.0,
        estimated_cpm=15.0,
        conversion_rate_pct=3.2,
        avg_order_value=75.0,
        repeat_customer_ltv_multiplier=1.4,
        organically_amplified_reach_pct=35.0
    ),
    ROIInputs(
        campaign_name="National Championship TV Spot",
        channel_type=ChannelType.LIVE_TV,
        initial_ad_spend=150000.0,
        peak_viewership=850000,
        avg_viewership=600000,
        broadcast_duration_hours=3.5,
        estimated_cpm=28.0,
        conversion_rate_pct=1.2,
        avg_order_value=120.0,
        repeat_customer_ltv_multiplier=1.25,
        organically_amplified_reach_pct=15.0
    ),
    ROIInputs(
        campaign_name="Viral TikTok Live Product Drop",
        channel_type=ChannelType.TIKTOK_LIVE,
        initial_ad_spend=15000.0,
        peak_viewership=95000,
        avg_viewership=40000,
        broadcast_duration_hours=2.0,
        estimated_cpm=10.0,
        conversion_rate_pct=4.5,
        avg_order_value=45.0,
        repeat_customer_ltv_multiplier=1.5,
        organically_amplified_reach_pct=60.0
    )
]

# Initialize in-memory storage with demo snapshots
snapshots_db: Dict[str, CampaignSnapshot] = {}

for idx, demo_input in enumerate(DEMO_CAMPAIGNS):
    snap_id = f"demo-{idx + 1}"
    snapshots_db[snap_id] = CampaignSnapshot(
        id=snap_id,
        title=demo_input.campaign_name,
        created_at="Pre-loaded Demo Scenario",
        inputs=demo_input,
        result=calculate_roi(demo_input)
    )

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
    """List all saved campaign snapshots including demo scenarios."""
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
