from enum import Enum
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, ConfigDict

class ChannelType(str, Enum):
    LIVE_TV = "live_tv"
    TWITCH = "twitch"
    YOUTUBE_LIVE = "youtube_live"
    OTT_STREAMING = "ott_streaming"
    TIKTOK_LIVE = "tiktok_live"

class ROIInputs(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    campaign_name: str = Field("New Event Campaign", description="Name of the event or campaign")
    channel_type: ChannelType = Field(ChannelType.TWITCH, description="Platform channel type")
    initial_ad_spend: float = Field(10000.0, ge=0, description="Initial Ad Spend ($)")
    peak_viewership: int = Field(50000, ge=0, description="Peak concurrent viewership")
    avg_viewership: int = Field(30000, ge=0, description="Average concurrent viewership")
    broadcast_duration_hours: float = Field(3.0, gt=0, description="Event duration in hours")
    estimated_cpm: float = Field(15.0, ge=0, description="Cost per thousand impressions ($)")
    conversion_rate_pct: float = Field(2.5, ge=0, le=100, description="Conversion rate percentage (%)")
    avg_order_value: float = Field(50.0, ge=0, description="Average order value per conversion ($)")
    repeat_customer_ltv_multiplier: float = Field(1.2, ge=1.0, description="LTV growth multiplier")
    organically_amplified_reach_pct: float = Field(20.0, ge=0, description="Viral / organic amplification percentage (%)")

class ChannelBenchmark(BaseModel):
    channel_type: ChannelType
    name: str
    description: str
    avg_engagement_rate: float
    typical_conversion_rate: float
    cpm_range: str
    decay_rate: float
    viral_coefficient: float

class TimelinePoint(BaseModel):
    period_label: str
    month: int
    direct_revenue: float
    ltv_revenue: float
    total_revenue: float
    cumulative_cost: float
    roi_percentage: float
    projected_conversions: int
    impressions: int

class ROICalculationResult(BaseModel):
    inputs: ROIInputs
    total_impressions: int
    effective_cpm: float
    estimated_conversions: int
    direct_revenue: float
    ltv_revenue: float
    net_profit: float
    roi_percentage: float
    breakeven_conversions: int
    timeline_forecast: List[TimelinePoint]
    channel_insights: Dict[str, str]

class CampaignSnapshot(BaseModel):
    id: str
    title: str
    created_at: str
    inputs: ROIInputs
    result: ROICalculationResult
