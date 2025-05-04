# Setup Instructions

## 1. Setting up PostgreSQL Database

1. Open Terminal and connect to PostgreSQL:
   ```bash
   psql -U postgres
   ```

2. Create a new database:
   ```sql
   CREATE DATABASE reviews_db;
   ```

3. Connect to the new database:
   ```sql
   \c reviews_db
   ```

## 2. Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy your CSV files from Google Sheets to the csv_files folder

4. Update database credentials in server.js and import-data.js

5. Import data from CSV to PostgreSQL:
   ```bash
   npm run import
   ```

6. Start the backend server:
   ```bash
   npm start
   ```

## 3. Frontend Setup

1. Navigate to the frontend folder

2. Update API_URL in app.js to match your backend server

3. Open index.html in your browser or use a simple web server:
   ```bash
   npx http-server
   ```

## 4. Automated Data Updates

To keep PostgreSQL in sync with your Google Sheets:

1. Modify your n8n workflow to export CSVs after updating Google Sheets
2. Schedule the import-data.js script to run after your Google Sheets update
