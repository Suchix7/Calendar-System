// models/Event.js
const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  dateKey: { type: String, required: true, unique: true }, // Format: "YYYY-MM-DD"
  content: { type: String, required: true },
});

module.exports = mongoose.model("Event", EventSchema);
