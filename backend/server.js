import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// --- Event Schema & Model ---
const eventSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
    note: { type: String, required: true },
  },
  { timestamps: true },
);

const Event = mongoose.model("Event", eventSchema);

// --- Routes ---

// 1. PUBLIC: Get all calendar events
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find();
    // Transform array to a simple object for React: { "2026-02-22": "Note text" }
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
// Note: Later we will add Auth Middleware here
app.post("/api/events", async (req, res) => {
  const { date, note } = req.body;

  if (!date || !note) {
    return res.status(400).json({ error: "Date and note are required" });
  }

  try {
    const updatedEvent = await Event.findOneAndUpdate(
      { date },
      { note },
      { upsert: true, new: true }, // Upsert means: Create if not exists, update if it does
    );
    res.status(200).json(updatedEvent);
  } catch (err) {
    res.status(500).json({ error: "Failed to save event" });
  }
});

// 3. ADMIN: Delete an event
app.delete("/api/events/:date", async (req, res) => {
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
