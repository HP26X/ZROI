# ZROI - Live Event ROI Forecasting & Analytics System

ZROI is an interactive web platform and algorithmic engine designed to forecast and calculate Return on Investment (ROI) for brands marketing across **TV broadcasts** and **Online Streaming Events** (Twitch, YouTube Live, TikTok Live, OTT).

## Live Demo Walkthrough

### 1. Interactive Forecasting Sliders
Adjust parameters live to see immediate recalculations across KPI cards and 12-month projections:
- **Initial Ad Spend ($)**: Range $1k - $250k
- **Viewership Metrics**: Concurrent average viewership and peak concurrent spikes
- **Broadcast Duration**: Event length in hours
- **Conversion Rate (%)**: Direct digital action percentage
- **Avg Order Value ($) & LTV Multiplier**: Customer value and repeat purchase factor
- **Organic Amplification (%)**: Viral reach coefficient per channel

### 2. Multi-Channel Benchmarks
Select different broadcast formats to apply channel-specific decay and viral benchmarks:
- **Twitch Live Streaming**: High chat engagement, direct digital conversion, fast peak
- **YouTube Live & VOD**: Long-tail replay value and sustained search traffic
- **Live Broadcast TV**: Mass national reach with linear decay
- **TikTok Live**: High viral impulse purchases and short session loops
- **OTT / Connected TV**: Targeted digital CTV ads with cross-device attribution

### 3. Interactive Visualizations
Switch between 3 graph views:
- **ROI % Curve**: Cumulative 12-month Return on Investment
- **Revenue vs Cost**: Direct sales revenue vs. total LTV revenue vs. initial ad spend
- **Conversions**: Projected monthly conversion volumes

### 4. Scenario Snapshots & Export
Click **"Load Full Demo"** to populate pre-configured commercial scenarios (Super Bowl TV spot, Twitch Esports Championship, TikTok Live viral drop). Save custom models, compare scenarios side-by-side, and export complete model data as JSON.

## Project Structure

```
.
├── backend/            # FastAPI Python backend
│   ├── app/            # Application modules (ROI engine, models, routes)
│   ├── tests/          # Unit and integration tests
│   └── requirements.txt
├── frontend/           # React + TypeScript + Vite frontend
│   ├── src/            # Components, demo scenarios, ROI engine, and charts
│   └── package.json
├── LICENSE             # Proprietary License
└── README.md           # Documentation
```

## Getting Started

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
pytest # Run test suite
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## License

This project is licensed under a Proprietary / All Rights Reserved License - see the [LICENSE](LICENSE) file for details.
