const { Pool } = require("pg");
const dotenv   = require("dotenv");
dotenv.config();

const pool = new Pool({
  host    : process.env.DB_HOST,
  user    : process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port    : process.env.DB_PORT || 5432,
});

pool.connect((err) => {
  if (err) console.error("DB Connection Error:", err.message);
  else     console.log("PostgreSQL connected ✅");
});

module.exports = pool;