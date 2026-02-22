import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Calendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [notes, setNotes] = useState({});

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDay = useMemo(
    () => new Date(currentYear, currentMonth, 1).getDay(),
    [currentMonth, currentYear],
  );
  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0).getDate(),
    [currentMonth, currentYear],
  );

  const handlePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

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
    <div className="w-full max-w-6xl bg-white rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-0 border border-stone-100">
      {/* Calendar Section */}
      <div className="lg:col-span-2 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-serif font-medium text-stone-900">
              {monthName}{" "}
              <span className="text-stone-400 font-sans font-light">
                {currentYear}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl border border-stone-100 hover:bg-stone-50 text-stone-600 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            <select
              className="bg-stone-50 border-none rounded-xl px-4 py-2 text-sm font-medium text-stone-700 focus:ring-2 focus:ring-stone-200 outline-none cursor-pointer"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>

            <button
              onClick={handleNext}
              className="p-2 rounded-xl border border-stone-100 hover:bg-stone-50 text-stone-600 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-4">
          {days.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] uppercase tracking-[0.2em] font-bold text-stone-400 py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
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
              <motion.button
                key={fullDate}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedDate(fullDate)}
                className={`
                  relative p-2 sm:p-4 rounded-2xl text-sm transition-all flex flex-col items-center justify-center min-h-[64px] sm:min-h-[80px] border
                  ${
                    selected
                      ? "bg-stone-800 text-white border-stone-800 shadow-md shadow-stone-200"
                      : "bg-white text-stone-700 border-transparent hover:border-stone-200 hover:bg-stone-50/50"
                  }
                `}
              >
                <span
                  className={`
                  ${isToday(currentYear, currentMonth, day) ? "underline underline-offset-4 decoration-stone-400" : ""}
                  ${selected ? "font-bold" : "font-medium"}
                `}
                >
                  {day}
                </span>
                {hasNote && (
                  <div
                    className={`
                    w-1 h-1 rounded-full mt-2
                    ${selected ? "bg-stone-300" : "bg-stone-400"}
                  `}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Sidebar for Notes */}
      <aside className="bg-stone-50/50 border-l border-stone-100 p-8 lg:p-10 flex flex-col">
        <h3 className="text-lg font-serif font-medium text-stone-800 mb-6">
          Event Details
        </h3>

        {selectedDate ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-6">
              <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">
                Date Selected
              </span>
              <p className="text-stone-700 font-medium">{selectedDate}</p>
            </div>

            <textarea
              className="w-full flex-1 p-4 rounded-2xl border border-stone-200 bg-white focus:border-stone-400 focus:ring-4 focus:ring-stone-100 outline-none transition-all resize-none text-stone-700 placeholder:text-stone-300 placeholder:italic"
              placeholder="Record a service, meeting, or community event..."
              value={notes[selectedDate] || ""}
              onChange={(e) =>
                setNotes({ ...notes, [selectedDate]: e.target.value })
              }
            />

            <button
              onClick={() => setSelectedDate(null)}
              className="mt-6 w-full py-3 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors shadow-sm"
            >
              Clear Selection
            </button>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-white border border-stone-100 flex items-center justify-center mb-4 opacity-50">
              <div className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
            </div>
            <p className="text-stone-400 text-sm font-light leading-relaxed italic">
              Select a date on the calendar to view or schedule community
              gatherings.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
