const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const pool    = require("../db");

// ── REGISTER ─────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  try {
    // Check if email already exists
    const exists = await pool.query(
      "SELECT id FROM users WHERE email = $1", [email]
    );
    if (exists.rows.length > 0)
      return res.status(409).json({ error: "Email already registered" });

    // Hash password and save
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hashed]
    );

    res.status(201).json({
      message: "Account created successfully",
      user: result.rows[0]
    });

  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ── LOGIN ─────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "All fields are required" });

  try {
    // Check if user exists
    const result = await pool.query(
      `SELECT id, name, email, password, skills, bio, github_url, linkedin_url
       FROM users WHERE email = $1`,
      [email]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "No account found with this email" });

    // Check password
    const user    = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Incorrect password" });

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send back user without password
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;