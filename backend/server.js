import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGODB_URI;

app.use(cors());
// Parse incoming JSON requests
app.use(express.json());

// --- Database Connection ---
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// --- Routes ---
app.get("/api", (req, res) => {
  res.status(200).json({ message: "MERN Backend API is running!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
