# Market Basket Analysis Setup Guide

This guide explains how to run the full project locally.

## 1) Requirements

- Windows, macOS, or Linux
- Python 3.11 to 3.13
- Node.js 18+
- npm
- Git

## 2) Project Structure

- backend: Flask API, preprocessing, FP-Growth mining
- frontend: React dashboard and reports
- data.csv: sample retail dataset you can upload in dashboard

## 3) Backend Setup

1. Open terminal in the project root.
2. Run:

   cd backend
   python -m pip install --upgrade pip setuptools wheel
   pip install -r requirements.txt

3. Start backend API:

   python app.py

4. Verify backend is running:

   http://localhost:5000/api/health

## 4) Frontend Setup

1. Open another terminal in the project root.
2. Run:

   cd frontend
   npm install
   npm run dev

3. Open frontend URL shown in terminal (usually):

   http://localhost:5173

If 5173 is already in use, Vite will use another port (for example 5174).

## 5) How to Use

1. Open Dashboard page.
2. Drag and drop your CSV file.
3. Click Analyze Dataset.
4. The app runs preprocessing first, then suitability check, then FP-Growth mining.
5. Explore:
   - Top Product Demand chart
   - Quick Recommendations
   - Reports page charts and rule table

## 6) CSV Requirements

Required columns:
- Invoice or Order id
- Product or Item name

Optional columns (improves charts):
- Country
- InvoiceDate
- Quantity
- UnitPrice

## 7) Current Mining Pipeline

- Cleaning and preprocessing:
  - remove blank invoice/item rows
  - remove cancelled invoices (Invoice starts with C)
  - remove common service/noise items
  - remove non-positive quantity/price if present
- Suitability check:
  - requires at least 2 transactions and 2 unique items after cleaning
- Algorithm:
  - FP-Growth only

## 8) Troubleshooting

Backend import or dependency errors:
- Run again:

  cd backend
  python -m pip install --upgrade pip setuptools wheel
  pip install -r requirements.txt

Backend starts but path/data errors:
- Start backend from project backend folder:

  cd backend
  python app.py

Frontend build errors:
- Run:

  cd frontend
  npm install
  npm run build

No results after upload:
- Ensure backend is running on port 5000
- Re-upload CSV and click Analyze Dataset
- Check browser console for API errors

## 9) Production Notes

- Flask app.py currently runs development server only.
- For production deployment, use a WSGI server (for example gunicorn or waitress).
- Configure CORS and environment variables per deployment environment.
