// server.js - Backend server for Google Maps Reviews application
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL connection pool
const pool = new Pool({
  host: 'localhost',
  port: 5432,         // Default PostgreSQL port
  database: 'reviews_db',
  user: 'postgres',    // Update with your PostgreSQL username
  password: 'password' // Update with your PostgreSQL password
});

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// API Routes

// Get all reviews, optionally filtered by business
app.get('/api/reviews', async (req, res) => {
  try {
    const business = req.query.business;
    
    let query;
    let params = [];
    
    if (business && business !== 'all') {
      query = 'SELECT * FROM reviews WHERE business = $1';
      params = [business];
    } else {
      query = 'SELECT * FROM reviews';
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'An error occurred while fetching reviews' });
  }
});

// Get review statistics by business
app.get('/api/stats', async (req, res) => {
  try {
    const business = req.query.business;
    
    let query;
    let params = [];
    
    if (business && business !== 'all') {
      query = `
        SELECT 
          COUNT(*) as total_reviews,
          ROUND(AVG(stars), 1) as average_rating,
          COUNT(CASE WHEN stars = 1 THEN 1 END) as one_star,
          COUNT(CASE WHEN stars = 2 THEN 1 END) as two_stars,
          COUNT(CASE WHEN stars = 3 THEN 1 END) as three_stars,
          COUNT(CASE WHEN stars = 4 THEN 1 END) as four_stars,
          COUNT(CASE WHEN stars = 5 THEN 1 END) as five_stars
        FROM reviews
        WHERE business = $1
      `;
      params = [business];
    } else {
      query = `
        SELECT 
          COUNT(*) as total_reviews,
          ROUND(AVG(stars), 1) as average_rating,
          COUNT(CASE WHEN stars = 1 THEN 1 END) as one_star,
          COUNT(CASE WHEN stars = 2 THEN 1 END) as two_stars,
          COUNT(CASE WHEN stars = 3 THEN 1 END) as three_stars,
          COUNT(CASE WHEN stars = 4 THEN 1 END) as four_stars,
          COUNT(CASE WHEN stars = 5 THEN 1 END) as five_stars
        FROM reviews
      `;
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'An error occurred while fetching statistics' });
  }
});

// Get reviews by month
app.get('/api/timeline', async (req, res) => {
  try {
    const business = req.query.business;
    
    let query;
    let params = [];
    
    if (business && business !== 'all') {
      query = `
        SELECT 
          TO_CHAR(DATE(published_at_date), 'YYYY-MM') as month,
          COUNT(*) as count
        FROM reviews
        WHERE business = $1
        GROUP BY month
        ORDER BY month
      `;
      params = [business];
    } else {
      query = `
        SELECT 
          TO_CHAR(DATE(published_at_date), 'YYYY-MM') as month,
          COUNT(*) as count
        FROM reviews
        GROUP BY month
        ORDER BY month
      `;
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching timeline:', err);
    res.status(500).json({ error: 'An error occurred while fetching timeline data' });
  }
});

// Get list of businesses
app.get('/api/businesses', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT business 
      FROM reviews 
      ORDER BY business
    `;
    
    const result = await pool.query(query);
    res.json(result.rows.map(row => row.business));
  } catch (err) {
    console.error('Error fetching businesses:', err);
    res.status(500).json({ error: 'An error occurred while fetching businesses' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
