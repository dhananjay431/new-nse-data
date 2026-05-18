# NSE India Dashboard – Page 1

## Overview
This page provides the **Equity Stock Indices** view for any selected NSE index.

## Features
- **Index Dropdown** fetched from `/api/allIndices`
- **Dynamic Table** populated from `/api/equity-stockIndices?index={selected}`
- **Column Sorting** (Ascending / Descending)
- **Column Filtering** with operators: `=`, `>=`, `<=`, `>`, `<`

## Tech Stack
- React 19 + Vite
- Tailwind CSS (Slate / Indigo palette)
- Axios for API calls
- React Router for navigation
- Lucide React icons

## How to Run
1. Ensure the proxy backend is running:
   ```bash
   node server.js
   ```
   (runs on port 3000)

2. In another terminal, start the React frontend:
   ```bash
   cd frontend
   npm run dev
   ```
   (runs on port 5173 by default)

3. Open http://localhost:5173

## API Endpoints Used
| Endpoint | Description |
|----------|-------------|
| `GET /api/allIndices` | Fetch all NSE indices for the dropdown |
| `GET /api/equity-stockIndices?index={name}` | Fetch constituent data for a selected index |
