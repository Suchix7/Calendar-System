import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  Calendar as CalendarIcon,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import api from "../api/axios";

export default function AdminCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [notes, setNotes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setIsFetching(true);
        const res = await api.get("/api/events");
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
      await api.post("/api/events", {
        date: selectedDate,
        note: notes[selectedDate],
      });
      alert("Saved!");
      setIsModalOpen(false); // Close modal if open after saving
    } catch (err) {
      alert("Unauthorized. Please log in again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDate) return;
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await api.delete(`/api/events/${selectedDate}`);
      const updatedNotes = { ...notes };
      delete updatedNotes[selectedDate];
      setNotes(updatedNotes);
      setSelectedDate(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error deleting:", err);
      alert(err.response?.data?.error || "Failed to delete.");
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

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="w-full bg-white rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 border border-stone-100 shadow-sm relative">
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
                  className={`relative p-2 sm:p-4 rounded-2xl text-sm transition-all flex flex-col items-center justify-center min-h-[64px] sm:min-h-[80px] border ${
                    selected
                      ? "bg-stone-800 text-white border-stone-800 shadow-md"
                      : "bg-white text-stone-700 border-transparent hover:bg-stone-50"
                  }`}
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

              <div className="flex-1 flex flex-col relative group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">
                    Edit Event
                  </span>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="p-1 hover:bg-stone-200 rounded text-stone-400 hover:text-stone-600 transition-colors"
                    title="Open Fullscreen"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
                <textarea
                  className="w-full flex-1 p-4 rounded-2xl border border-stone-200 bg-white focus:ring-2 focus:ring-stone-100 outline-none resize-none text-stone-700 placeholder:text-stone-300 placeholder:italic"
                  placeholder="Type service details..."
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

      {/* Full Screen Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl h-full max-h-[800px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div>
                  <h4 className="font-serif text-xl text-stone-900">
                    Editing: {selectedDate}
                  </h4>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">
                    Full Screen Mode
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-stone-200 rounded-full text-stone-500"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 p-8">
                <textarea
                  className="w-full h-full p-6 text-lg border-none focus:ring-0 outline-none resize-none text-stone-800 placeholder:italic"
                  placeholder="Start typing the event details here..."
                  autoFocus
                  value={notes[selectedDate] || ""}
                  onChange={(e) =>
                    setNotes({ ...notes, [selectedDate]: e.target.value })
                  }
                />
              </div>

              <div className="p-6 border-t border-stone-100 flex items-center justify-between bg-stone-50/50">
                <button
                  onClick={handleDelete}
                  className="px-6 py-2.5 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors"
                >
                  Delete Event
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-stone-600 font-medium hover:bg-stone-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-2.5 bg-stone-800 text-white rounded-xl font-semibold hover:bg-stone-900 transition-all shadow-md"
                  >
                    <Save size={18} />{" "}
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
