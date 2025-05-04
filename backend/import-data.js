// import-data.js - Script to import Google Sheets data into PostgreSQL
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'reviews_db',
  user: 'postgres',    // Update with your PostgreSQL username
  password: 'password' // Update with your PostgreSQL password
});

// Create reviews table if it doesn't exist
async function createTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        business VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        stars INTEGER,
        name VARCHAR(255),
        original_language VARCHAR(50),
        text TEXT,
        text_translated TEXT,
        response_from_owner_text TEXT,
        date_published VARCHAR(100),
        published_at_date TIMESTAMP,
        reviewer_number_of_reviews INTEGER,
        review_url TEXT,
        date_added_in_list VARCHAR(100),
        review_image_urls TEXT[]
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('Reviews table created or already exists');
  } catch (err) {
    console.error('Error creating table:', err);
    throw err;
  }
}

// Process CSV files and import data
async function importData() {
  try {
    // Create table first
    await createTable();
    
    // Specify the directory containing your CSV files
    const csvDir = './csv_files';
    
    // Get list of CSV files
    const files = fs.readdirSync(csvDir).filter(file => file.endsWith('.csv'));
    
    console.log(`Found ${files.length} CSV files to import`);
    
    // Process each file
    for (const file of files) {
      const filePath = path.join(csvDir, file);
      const businessName = file.replace('.csv', ''); // Extract business name from filename
      
      console.log(`Importing data for ${businessName} from ${filePath}`);
      
      // Clear existing data for this business
      await pool.query('DELETE FROM reviews WHERE business = $1', [businessName]);
      
      // Read and process the CSV file
      const rows = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Transform row data as needed
          rows.push(row);
        })
        .on('end', async () => {
          // Insert data in batches
          const batchSize = 100;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const values = batch.map(row => ({
              business: businessName,
              title: row.title || null,
              stars: parseInt(row.stars) || null,
              name: row.name || null,
              original_language: row.originalLanguage || null,
              text: row.text || null,
              text_translated: row.textTranslated || null,
              response_from_owner_text: row.responseFromOwnerText || null,
              date_published: row['Date Published'] || null,
              published_at_date: row.publishedAtDate ? new Date(row.publishedAtDate) : null,
              reviewer_number_of_reviews: parseInt(row.reviewerNumberOfReviews) || null,
              review_url: row.reviewUrl || null,
              date_added_in_list: row['Date added in the list'] || null,
              // Combine all image URLs into an array
              review_image_urls: Object.keys(row)
                .filter(key => key.startsWith('reviewImageUrls'))
                .map(key => row[key])
                .filter(url => url && url.trim() !== '')
            }));
            
            // Insert batch
            for (const value of values) {
              try {
                await pool.query(
                  `INSERT INTO reviews 
                  (business, title, stars, name, original_language, text, text_translated, 
                   response_from_owner_text, date_published, published_at_date, 
                   reviewer_number_of_reviews, review_url, date_added_in_list, review_image_urls)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                  [
                    value.business, value.title, value.stars, value.name, 
                    value.original_language, value.text, value.text_translated,
                    value.response_from_owner_text, value.date_published, value.published_at_date,
                    value.reviewer_number_of_reviews, value.review_url, value.date_added_in_list,
                    value.review_image_urls
                  ]
                );
              } catch (err) {
                console.error('Error inserting row:', err, value);
              }
            }
            
            console.log(`Imported batch ${i/batchSize + 1} of ${Math.ceil(rows.length/batchSize)} for ${businessName}`);
          }
          
          console.log(`Completed import for ${businessName}`);
        });
    }
    
    console.log('All imports initiated');
  } catch (err) {
    console.error('Error during import:', err);
  }
}

// Run the import
importData().then(() => {
  console.log('Import process started');
}).catch(err => {
  console.error('Import failed:', err);
});
