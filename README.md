# InsightBoard

InsightBoard is an executive business intelligence and decision support dashboard for revenue, profitability, forecasting, and strategy planning. It combines a Python Flask API with a React + TypeScript frontend to turn transaction data into KPI cards, trend analysis, simulation tools, and downloadable reports.

The app is designed for business leaders who want a fast way to review performance, explore operational drivers, and evaluate strategic changes before committing to a decision.

---

## Overview

InsightBoard includes:

- Executive KPI monitoring with revenue, profit, margin, customer growth, CAC, and MRR views
- Revenue and segment analytics by region, product, and customer segment
- Profitability analysis across costs and margin drivers
- Forecasting for revenue, profit, and customer growth using multiple models
- What-if simulation for pricing, marketing spend, and demand assumptions
- Rule-based recommendations for business action planning
- RBAC-style role access for viewer, manager, and executive personas
- PDF and CSV reporting for stakeholder-ready outputs

---

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Recharts
- Lucide React

### Backend
- Python 3.10+
- Flask
- Flask-CORS
- PyMongo
- Pandas
- NumPy
- scikit-learn
- ReportLab

### Data Layer
- MongoDB

---

## Project Structure

```text
InsightBoard/
├── backend/
│   ├── app.py
│   ├── db.py
│   ├── forecaster.py
│   ├── recommender.py
│   ├── reporting.py
│   ├── requirements.txt
│   └── seed_db.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── README.md
│   └── src/
│       ├── App.tsx
│       ├── index.css
│       ├── main.tsx
│       ├── components/
│       └── views/
│           ├── DashboardOverview.tsx
│           ├── ForecastingEngine.tsx
│           ├── ProfitabilityAnalysis.tsx
│           ├── Recommendations.tsx
│           ├── ReportingCenter.tsx
│           ├── RevenueAnalytics.tsx
│           └── WhatIfSimulation.tsx
├── README.md
└── .gitignore
```

---

## Prerequisites

Before starting, install:

- Python 3.10+
- Node.js 18+
- MongoDB Community Server running locally on port 27017

---

## Local Setup

### 1) Backend setup

From the project root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

Windows PowerShell:
```powershell
.venv\Scripts\Activate.ps1
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Then install dependencies:

```bash
pip install -r requirements.txt
```

Seed the database:

```bash
python seed_db.py
```

This generates sample transaction data and loads it into MongoDB.

Start the Flask API:

```bash
python app.py
```

The API runs at:

```text
http://127.0.0.1:5001
```

---

### 2) Frontend setup

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend is served by Vite at:

```text
http://localhost:5173/
```

---

## App Workflow

1. Open the UI at http://localhost:5173/
2. Use the global filters to narrow by date, region, product, or customer type
3. Review KPI cards and trends on the overview dashboard
4. Drill into revenue and profitability data for more detail
5. Explore forecasting and scenario simulation tools
6. Review recommendations and export PDF or CSV reports

---

## Role Access

The front-end includes role-based visibility:

- Executive: full access to all views and reporting
- Manager: dashboard, analytics, forecasting, and recommendations access
- Viewer: limited access to overview and recommendation views

---

## Important Notes

- The backend expects MongoDB to be available on localhost:27017.
- The app uses the local Flask backend at http://127.0.0.1:5001 for API calls from the frontend.
- Report generation and recommendation logic are handled server-side in the Python backend.

---

## Typical Development Flow

```bash
# Terminal 1
cd backend
.venv\Scripts\Activate.ps1
python app.py

# Terminal 2
cd frontend
npm run dev
```

This is the normal local workflow for developing and testing the dashboard.
