# ZROI - Live Event ROI Forecasting & Analytics System

ZROI is an interactive web platform and algorithmic engine designed to forecast and calculate Return on Investment (ROI) for brands marketing across **TV broadcasts** and **Online Streaming Events** (Twitch, YouTube Live, Streaming TV, OTT).

## Key Features

- **Live Adjustable ROI Forecasting Engine**: Instant recalculations driven by dynamic interactive sliders for Ad Spend, Viewership, Conversion Rate, CPM, and Broadcast Duration.
- **Multi-Channel Trend Benchmark Algorithms**: Specialized algorithms adjusting for channel characteristics (e.g., Live TV high-reach linear decay vs. Twitch high-engagement chat interactive spikes).
- **Interactive Graphs & Visualizations**: Timeline projections showing expected ROI %, revenue trajectories, total impression reach, and cost comparisons over time.
- **Snapshot & Scenario Comparison**: Save timeline snapshots of different marketing campaigns, compare expected vs. aggressive forecast models, and export data.
- **Full-Stack Architecture**: Built with Python (FastAPI) on the backend for high-precision mathematical models and React (TypeScript + Tailwind CSS + Recharts) on the frontend.

## Project Structure

```
.
├── backend/            # FastAPI Python backend
│   ├── app/            # Application modules (ROI engine, models, routes)
│   ├── tests/          # Unit and integration tests
│   └── requirements.txt
├── frontend/           # React + TypeScript + Vite frontend
│   ├── src/            # Components, hooks, ROI state, and charts
│   └── package.json
├── LICENSE             # MIT License
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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
