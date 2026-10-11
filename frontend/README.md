# InsightBoard Frontend

This directory contains the React + TypeScript frontend for the InsightBoard executive dashboard.

## Stack

- React 19
- TypeScript
- Vite
- Recharts
- Lucide React

## Run locally

```bash
npm install
npm run dev
```

The app usually runs on:

```text
http://localhost:5173/
```

## Notes

- The frontend expects the Flask backend to be running at http://127.0.0.1:5001.
- Global filters and dashboard data are fetched from the backend API.
- The app includes role-based navigation, forecasting, profitability views, report generation, and scenario simulation.
