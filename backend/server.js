import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { loginUser, registerUser } from "./controllers/authController.js"; // Importing your new controller
import { verifyToken } from "./middleware/auth.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;
const allowedOrigins = [
  "http://localhost:5173", // Local Vite
  "http://localhost:3000", // Local Create-React-App
  "https://your-app-name.vercel.app", // YOUR ACTUAL VERCEL URL (Add this after deploying FE)
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("CORS policy blocked this origin."), false);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json());

// --- Database Connection ---
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

const eventSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true },
    note: { type: String, required: true },
  },
  { timestamps: true },
);
const Event = mongoose.model("Event", eventSchema);

// --- AUTH ROUTES ---
// This connects the login function you wrote to the /api/auth/login URL
app.post("/api/auth/login", loginUser);
app.post("/api/auth/register", registerUser);
// --- CALENDAR ROUTES ---

// 1. PUBLIC: Get all calendar events
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find();
    const eventMap = {};
    events.forEach((event) => {
      eventMap[event.date] = event.note;
    });
    res.status(200).json(eventMap);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// 2. ADMIN: Save or update an event
app.post("/api/events", verifyToken, async (req, res) => {
  const { date, note } = req.body;
  if (!date || !note)
    return res.status(400).json({ error: "Date and note are required" });

  try {
    const updatedEvent = await Event.findOneAndUpdate(
      { date },
      { note },
      { upsert: true, new: true },
    );
    res.status(200).json(updatedEvent);
  } catch (err) {
    res.status(500).json({ error: "Failed to save event" });
  }
});

// 3. ADMIN: Delete an event
app.delete("/api/events/:date", verifyToken, async (req, res) => {
  try {
    await Event.findOneAndDelete({ date: req.params.date });
    res.status(200).json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete event" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
