const express = require("express");
const cors    = require("cors");
const dotenv  = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors({ origin: "http://127.0.0.1:5500" }));
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => res.send("DevFinder API running ✅"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));