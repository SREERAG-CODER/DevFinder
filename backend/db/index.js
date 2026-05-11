const { Pool } = require("pg");
const dotenv   = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) console.error("DB Connection Error:", err.message);
  else     console.log("PostgreSQL connected ✅");
});

module.exports = pool;