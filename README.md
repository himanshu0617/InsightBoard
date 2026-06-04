# InsightBoard — Executive KPI & Decision Intelligence Platform

InsightBoard is a production-grade, enterprise business intelligence (BI) and decision intelligence platform designed for CEOs, CFOs, and business leaders to monitor key metrics, analyze segment profitability, forecast financial performance, simulate business decisions, and export presentation-ready reports.

The platform is designed to resemble premium business intelligence systems used by consulting firms and large enterprises like Amazon, Deloitte, Accenture, and McKinsey.

---

## 🚀 Key Features

*   **Executive KPI Cards**: Instant access to high-level corporate metrics including Total Revenue, Net Profit, Operating Margin, SaaS Monthly Recurring Revenue (MRR), Customer Growth, and Customer Acquisition Cost (CAC) with period-over-period growth indicators.
*   **Revenue & Segment Analytics**: Deep-dives into monthly performance trends, product-wise sales revenue, and regional market shares with interactive drill-down options.
*   **Profitability Analysis**: Visual breakdowns of costs (COGS, OpEx, and marketing CAC) paired with historical net profit margins.
*   **Time-Series Forecasting Engine**: Predicts Revenue, Profit, and Customer growth 12 months out using:
    *   *Ordinary Least Squares (OLS) Linear Regression*
    *   *Holt's Linear Exponential Smoothing (Double Smoothing)*
    *   *Simple Moving Averages*
*   **What-If Decision Simulator**: Interactive sliders modeling price adjustments (based on a standard -0.7 demand elasticity curve), marketing budget shifts, and customer growth trends to calculate LTV, CAC, and bottom-line variances.
*   **Decision Recommendations**: Machine heuristics analyze transactional records to output actionable strategic recommendations (e.g. sunsetting declining lines, reallocating budgets to high-margin products, optimizing regional operating costs).
*   **Reporting & Exports Center**:
    *   *PDF Exports*: Generates custom, presentation-ready PDF reports (Executive Summary, Quarterly Business, and Revenue Performance) via Python ReportLab.
    *   *CSV Spreadsheet Export*: Compiles monthly aggregated transactions for custom spreadsheet analysis.
*   **Role-Based Access Control (RBAC)**: Switch between three distinct roles:
    *   *Executive*: Full write access, simulation access, and PDF report downloads.
    *   *Manager*: Read-only access to dashboards, analytics, and forecasts.
    *   *Viewer*: Access limited to the main Dashboard Overview and Recommendations.
*   **Aesthetic Dark & Light Theme**: Slate layout theme with glassmorphic cards and polished micro-animations.

---

## 🛠️ Tech Stack

*   **Frontend**: React (v19), TypeScript, Tailwind CSS (v4), Recharts, Lucide Icons, Vite
*   **Backend**: Python Flask, PyMongo, Pandas, NumPy, Scikit-Learn
*   **Database**: MongoDB (Compass/Server v6+)
*   **Reporting**: ReportLab PDF library

---

## 📂 Project Structure

```text
InsightBoard/
├── backend/
│   ├── .venv/                  # Python Virtual Environment
│   ├── app.py                  # Flask main application & REST API routes
│   ├── db.py                   # MongoDB client connection helper
│   ├── seed_db.py              # 100,000+ transaction database generator
│   ├── forecaster.py           # Time-series forecasting models
│   ├── recommender.py          # Corporate heuristic recommendation compiler
│   ├── reporting.py            # ReportLab PDF design and compilation code
│   └── requirements.txt        # Backend python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── KPICard.tsx     # KPI metrics display card
│   │   ├── views/
│   │   │   ├── DashboardOverview.tsx    # Dashboard home view
│   │   │   ├── RevenueAnalytics.tsx     # Segment sales charts
│   │   │   ├── ProfitabilityAnalysis.tsx # Expense donut and margin trends
│   │   │   ├── ForecastingEngine.tsx    # Statistical projection charts
│   │   │   ├── WhatIfSimulation.tsx     # Sliders and variance tables
│   │   │   ├── Recommendations.tsx      # Corporate advisory card decks
│   │   │   └── ReportingCenter.tsx      # Export triggers & downloads
│   │   ├── App.tsx             # State filters and layout router
│   │   ├── index.css           # Tailwind base styles and glassmorphism CSS
│   │   └── main.tsx            # Main renderer
│   ├── package.json            # Node JS project packages
│   └── vite.config.ts          # Vite build parameters with Tailwind
└── README.md                   # Setup and usage guide
```

---

## ⚙️ Installation & Setup

### Prerequisites
Make sure you have the following installed on your machine:
*   [Python 3.10+](https://www.python.org/)
*   [Node.js v18+](https://nodejs.org/)
*   [MongoDB Server](https://www.mongodb.com/try/download/community) (running on `localhost:27017`)

---

### Step 1: Set Up & Seed the Backend Database

1.  Open your terminal and navigate to the `backend/` folder:
    ```powershell
    cd backend
    ```

2.  Create a Python virtual environment and activate it:
    ```powershell
    # Windows PowerShell
    python -m venv .venv
    .venv\Scripts\Activate.ps1
    ```

3.  Install Python dependencies:
    ```powershell
    pip install -r requirements.txt
    ```

4.  Generate the **100,000+ transactional records** (approx. 5.5 years of historical data) and seed your local MongoDB server:
    ```powershell
    python seed_db.py
    ```
    *You should see progress logs showing ~139,000 records seeded and MongoDB indexes created successfully.*

5.  Start the Flask API server:
    ```powershell
    python app.py
    ```
    *The API will start listening on `http://127.0.0.1:5000`.*

---

### Step 2: Set Up the Frontend React App

1.  Open a new terminal session and navigate to the `frontend/` folder:
    ```powershell
    cd frontend
    ```

2.  Install dependencies:
    ```powershell
    npm install
    ```

3.  Start the Vite development server:
    ```powershell
    npm run dev
    ```
    *The dashboard will start running at `http://localhost:5173/`.*

---

## 🖥️ How to Use

1.  Open [http://localhost:5173/](http://localhost:5173/) in your web browser.
2.  Use the **Global Filters** at the top of the screen to filter records by Region, Product, Customer Type, or Date Range. Charts and KPI calculations will update dynamically.
3.  Click on any product name in the **Overview Dashboard** tables or region list items to trigger a **drill-down** into the **Revenue Analytics** workspace.
4.  Switch your role profile (in the header) to see how access permissions alter:
    *   **Manager** hides What-If and PDF Report center screens.
    *   **Viewer** blocks tabs, restricting visibility to Overview and Recommendations only.
5.  Launch **What-If decision runs** by sliding adjustments under the simulation tab.
6.  Navigate to the **Reporting Center** to download print-ready PDFs compiled by the ReportLab engine.
