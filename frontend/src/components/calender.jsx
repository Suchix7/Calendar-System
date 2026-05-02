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
import NepaliDate from "nepali-date-converter";

export default function AdminCalendar() {
  const npToday = useMemo(() => new NepaliDate(), []);
  const [currentMonth, setCurrentMonth] = useState(npToday.getMonth());
  const [currentYear, setCurrentYear] = useState(npToday.getYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [notes, setNotes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Today's AD format string to match against calendar cells
  const todayAdFullDate = useMemo(() => {
    const adObj = npToday.getAD();
    return `${adObj.year}-${String(adObj.month + 1).padStart(2, "0")}-${String(adObj.date).padStart(2, "0")}`;
  }, [npToday]);

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
  const days = ["आइत", "सोम", "मङ्गल", "बुध", "बिही", "शुक्र", "शनि"];
  const firstDay = useMemo(
    () => new NepaliDate(currentYear, currentMonth, 1).getDay(),
    [currentMonth, currentYear],
  );
  const daysInMonth = useMemo(
    () => new NepaliDate(currentYear, currentMonth + 1, 0).getDate(),
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

  const formatFullDate = (y, m, d) => {
    const adDateObj = new NepaliDate(y, m, d).getAD();
    return `${adDateObj.year}-${String(adDateObj.month + 1).padStart(2, "0")}-${String(adDateObj.date).padStart(2, "0")}`;
  };

  const overlappingAdMonths = useMemo(() => {
    try {
      const npFirstDate = new NepaliDate(currentYear, currentMonth, 1);
      const adFirst = npFirstDate.getAD();
      const d1 = new Date(adFirst.year, adFirst.month, adFirst.date);

      const npLastDate = new NepaliDate(currentYear, currentMonth, daysInMonth);
      const adLast = npLastDate.getAD();
      const d2 = new Date(adLast.year, adLast.month, adLast.date);

      const m1 = d1.toLocaleString("en-US", { month: "short" });
      const m2 = d2.toLocaleString("en-US", { month: "short" });

      return m1 === m2 ? m1 : `${m1}/${m2}`;
    } catch {
      return "";
    }
  }, [currentYear, currentMonth, daysInMonth]);

  const monthName = useMemo(
    () => new NepaliDate(currentYear, currentMonth, 1).format("MMMM", "np"),
    [currentMonth, currentYear],
  );

  const yearNp = useMemo(
    () => new NepaliDate(currentYear, currentMonth, 1).format("YYYY", "np"),
    [currentYear, currentMonth],
  );

  const getSelectedBsDateString = (adDateStr) => {
    if (!adDateStr) return "";
    try {
      const d = new Date(adDateStr);
      return new NepaliDate(d).format("ddd, DD MMMM YYYY", "np");
    } catch {
      return adDateStr;
    }
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="w-full bg-white dark:bg-gray-900 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 border border-gray-100 dark:border-gray-800 shadow-sm relative transition-colors">
        {isFetching && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        )}

        {/* Main Calendar Section */}
        <div className="lg:col-span-2 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl flex items-baseline gap-2 font-serif font-medium text-gray-900 dark:text-gray-100">
              {monthName}{" "}
              <span className="text-gray-500 dark:text-gray-400 font-sans font-light">
                {yearNp}
              </span>
              {overlappingAdMonths && (
                <span className="text-gray-400 dark:text-gray-500 font-sans font-medium text-sm">
                  ({overlappingAdMonths})
                </span>
              )}
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-800 hover:border-red-100 dark:hover:border-gray-600 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-800 hover:border-red-100 dark:hover:border-gray-600 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2 sm:mb-4">
            {days.map((d, index) => (
              <div
                key={d}
                className={`text-center text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-[0.2em] font-bold leading-none truncate px-0.5 ${index === 6 ? 'text-red-600' : 'text-gray-400 dark:text-gray-500'}`}
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
              const npDate = new NepaliDate(currentYear, currentMonth, day);
              const adDateObj = npDate.getAD();
              const fullDate = `${adDateObj.year}-${String(adDateObj.month + 1).padStart(2, "0")}-${String(adDateObj.date).padStart(2, "0")}`;
              const hasNote = Boolean(notes[fullDate]);
              const selected = selectedDate === fullDate;
              const isToday = fullDate === todayAdFullDate;

              return (
                <button
                  key={fullDate}
                  onClick={() => setSelectedDate(fullDate)}
                  className={`relative p-1 sm:p-3 rounded-xl sm:rounded-2xl text-sm transition-all flex flex-col items-center justify-center min-h-[56px] sm:min-h-[80px] border ${
                    selected
                      ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-200/50 dark:shadow-none"
                      : isToday
                      ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-100/80 dark:hover:bg-red-950/50"
                      : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-100 dark:hover:border-gray-700"
                  }`}
                >
                  <span className={`text-base sm:text-xl ${selected ? "font-bold" : isToday ? "font-bold" : "font-semibold"} ${!selected && npDate.getDay() === 6 ? "text-red-500" : ""}`}>
                    {npDate.format("D", "np")}
                  </span>
                  <span className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 text-[8px] sm:text-xs font-sans ${selected ? "text-red-100" : isToday ? "text-red-400 dark:text-red-500" : npDate.getDay() === 6 ? "text-red-300 dark:text-red-900/80" : "text-gray-400 dark:text-gray-600"}`}>
                    {adDateObj.date}
                  </span>
                  {hasNote && (
                    <div
                      className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full absolute bottom-1 left-1.5 sm:bottom-2 sm:left-2 ${selected ? "bg-white" : "bg-green-500 dark:bg-green-600"}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Admin Sidebar */}
        <aside className="bg-gray-50/50 dark:bg-gray-900/50 border-l border-gray-100 dark:border-gray-800 p-5 sm:p-8 lg:p-10 flex flex-col">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <CalendarIcon size={20} className="text-red-500" />
            <h3 className="text-lg font-serif font-medium text-gray-800 dark:text-gray-200">
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
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
                  Selected Date
                </span>
                <p className="text-gray-800 dark:text-gray-200 font-medium text-lg">{getSelectedBsDateString(selectedDate)}</p>
              </div>

              <div className="flex-1 flex flex-col relative group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
                    Edit Event
                  </span>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-red-600 transition-colors"
                    title="Open Fullscreen"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
                <textarea
                  className="w-full flex-1 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/50 focus:border-red-300 dark:focus:border-gray-600 outline-none resize-none text-gray-800 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-600 placeholder:italic transition-colors"
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
                  className="flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-50 shadow-md shadow-red-200"
                >
                  <Save size={16} /> {isLoading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-800 text-red-600 dark:text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-700 transition-all"
                >
                  <Trash2 size={16} /> Delete Event
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-gray-400 dark:text-gray-500 text-sm italic">
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
              className="relative w-full max-w-4xl h-full max-h-[800px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <div>
                  <h4 className="font-serif text-xl text-gray-900 dark:text-gray-100">
                    Editing: {getSelectedBsDateString(selectedDate)}
                  </h4>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-red-500">
                    Full Screen Mode
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 p-8">
                <textarea
                  className="w-full h-full p-6 text-lg border-none bg-transparent focus:ring-0 outline-none resize-none text-gray-800 dark:text-gray-200 placeholder:italic placeholder-gray-300 dark:placeholder:text-gray-600"
                  placeholder="Start typing the event details here..."
                  autoFocus
                  value={notes[selectedDate] || ""}
                  onChange={(e) =>
                    setNotes({ ...notes, [selectedDate]: e.target.value })
                  }
                />
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <button
                  onClick={handleDelete}
                  className="px-6 py-2.5 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors"
                >
                  Delete Event
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md shadow-red-200"
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
