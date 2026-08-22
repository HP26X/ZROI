from fastapi.testclient import TestClient
from app.main import app
from app.models import ROIInputs, ChannelType
from app.roi_engine import calculate_roi, CHANNEL_BENCHMARKS

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "ZROI Engine"
    assert data["status"] == "online"

def test_benchmarks_endpoint():
    response = client.get("/api/benchmarks")
    assert response.status_code == 200
    data = response.json()
    assert "live_tv" in data
    assert "twitch" in data

def test_calculate_roi_logic():
    inputs = ROIInputs(
        campaign_name="Test Esports Event",
        channel_type=ChannelType.TWITCH,
        initial_ad_spend=10000.0,
        peak_viewership=50000,
        avg_viewership=30000,
        broadcast_duration_hours=4.0,
        estimated_cpm=15.0,
        conversion_rate_pct=2.0,
        avg_order_value=60.0,
        repeat_customer_ltv_multiplier=1.5,
        organically_amplified_reach_pct=25.0
    )

    result = calculate_roi(inputs)

    assert result.total_impressions > 0
    assert result.estimated_conversions > 0
    assert result.direct_revenue > 0
    assert result.ltv_revenue >= result.direct_revenue
    assert len(result.timeline_forecast) == 12
    assert result.timeline_forecast[0].period_label == "M1"
    assert result.timeline_forecast[11].period_label == "M12"

def test_calculate_endpoint():
    payload = {
        "campaign_name": "Test Stream",
        "channel_type": "twitch",
        "initial_ad_spend": 5000.0,
        "peak_viewership": 20000,
        "avg_viewership": 12000,
        "broadcast_duration_hours": 2.0,
        "estimated_cpm": 12.0,
        "conversion_rate_pct": 3.0,
        "avg_order_value": 40.0,
        "repeat_customer_ltv_multiplier": 1.2,
        "organically_amplified_reach_pct": 10.0
    }
    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["net_profit"] is not None
    assert "timeline_forecast" in data

def test_snapshot_lifecycle():
    payload = {
        "campaign_name": "Super Bowl Ad Test",
        "channel_type": "live_tv",
        "initial_ad_spend": 100000.0,
        "peak_viewership": 500000,
        "avg_viewership": 300000,
        "broadcast_duration_hours": 3.0,
        "estimated_cpm": 30.0,
        "conversion_rate_pct": 1.5,
        "avg_order_value": 100.0,
        "repeat_customer_ltv_multiplier": 1.3,
        "organically_amplified_reach_pct": 50.0
    }

    # Create snapshot
    save_res = client.post("/api/snapshots", json=payload)
    assert save_res.status_code == 200
    snap = save_res.json()
    snap_id = snap["id"]
    assert snap_id is not None

    # List snapshots
    list_res = client.get("/api/snapshots")
    assert list_res.status_code == 200
    snaps = list_res.json()
    assert any(s["id"] == snap_id for s in snaps)

    # Delete snapshot
    del_res = client.delete(f"/api/snapshots/{snap_id}")
    assert del_res.status_code == 200

    # Confirm deletion
    list_res_after = client.get("/api/snapshots")
    snaps_after = list_res_after.json()
    assert not any(s["id"] == snap_id for s in snaps_after)
