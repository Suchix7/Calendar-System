import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import axios from "axios";

export default function AdminCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [notes, setNotes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // --- Backend Integration ---
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setIsFetching(true);
        const res = await axios.get("http://localhost:5000/api/events");
        setNotes(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchCalendarData();
  }, []);

  const handleSave = async () => {
    if (!selectedDate) return;
    setIsLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/events",
        { date: selectedDate, note: notes[selectedDate] || "" },
        getAuthHeader(),
      );
      alert("Event saved successfully!");
    } catch (err) {
      alert("Failed to save. Ensure you are logged in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDate) return;
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/events/${selectedDate}`,
        getAuthHeader(),
      );
      const updatedNotes = { ...notes };
      delete updatedNotes[selectedDate];
      setNotes(updatedNotes);
      setSelectedDate(null);
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  // --- Calendar Logic ---
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstDay = useMemo(
    () => new Date(currentYear, currentMonth, 1).getDay(),
    [currentMonth, currentYear],
  );
  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0).getDate(),
    [currentMonth, currentYear],
  );

  const handlePrev = () =>
    currentMonth === 0
      ? (setCurrentMonth(11), setCurrentYear((y) => y - 1))
      : setCurrentMonth((m) => m - 1);
  const handleNext = () =>
    currentMonth === 11
      ? (setCurrentMonth(0), setCurrentYear((y) => y + 1))
      : setCurrentMonth((m) => m + 1);

  const formatFullDate = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const monthName = useMemo(
    () =>
      new Date(currentYear, currentMonth).toLocaleString("default", {
        month: "long",
      }),
    [currentMonth, currentYear],
  );
  const isToday = (y, m, d) =>
    y === today.getFullYear() &&
    m === today.getMonth() &&
    d === today.getDate();

  return (
    <div className="w-full max-w-6xl bg-white rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 border border-stone-100 shadow-sm relative">
      {/* Fetching Loader */}
      {isFetching && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
        </div>
      )}

      {/* Main Calendar Section */}
      <div className="lg:col-span-2 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <h2 className="text-2xl font-serif font-medium text-stone-900">
            {monthName}{" "}
            <span className="text-stone-400 font-sans font-light">
              {currentYear}
            </span>
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl border border-stone-100 hover:bg-stone-50 text-stone-600 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl border border-stone-100 hover:bg-stone-50 text-stone-600 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-4">
          {days.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const fullDate = formatFullDate(currentYear, currentMonth, day);
            const hasNote = Boolean(notes[fullDate]);
            const selected = selectedDate === fullDate;

            return (
              <button
                key={fullDate}
                onClick={() => setSelectedDate(fullDate)}
                className={`
                  relative p-2 sm:p-4 rounded-2xl text-sm transition-all flex flex-col items-center justify-center min-h-[64px] sm:min-h-[80px] border
                  ${selected ? "bg-stone-800 text-white border-stone-800 shadow-md" : "bg-white text-stone-700 border-transparent hover:bg-stone-50"}
                `}
              >
                <span className={selected ? "font-bold" : "font-medium"}>
                  {day}
                </span>
                {hasNote && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-2 ${selected ? "bg-stone-300" : "bg-indigo-500"}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Sidebar */}
      <aside className="bg-stone-50/50 border-l border-stone-100 p-8 lg:p-10 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <CalendarIcon size={20} className="text-stone-400" />
          <h3 className="text-lg font-serif font-medium text-stone-800">
            Admin Controls
          </h3>
        </div>

        {selectedDate ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col space-y-4"
          >
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">
                Selected Date
              </span>
              <p className="text-stone-700 font-medium">{selectedDate}</p>
            </div>

            <div className="flex-1 flex flex-col">
              <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-2">
                Edit Event
              </span>
              <textarea
                className="w-full flex-1 p-4 rounded-2xl border border-stone-200 bg-white focus:ring-2 focus:ring-stone-100 outline-none resize-none text-stone-700 placeholder:text-stone-300 placeholder:italic"
                placeholder="Type service details or meetings..."
                value={notes[selectedDate] || ""}
                onChange={(e) =>
                  setNotes({ ...notes, [selectedDate]: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 py-3 bg-stone-800 text-white rounded-xl text-sm font-semibold hover:bg-stone-900 transition-all disabled:opacity-50"
              >
                <Save size={16} /> {isLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all"
              >
                <Trash2 size={16} /> Delete Event
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-stone-400 text-sm italic">
              Select a date to create or modify events.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
