import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";

export default function ReadOnlyCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  // Mock Data: In a real app, this would come from an API or Props
  const events = {
    "2024-05-15": "Community Garden Workshop",
    "2024-05-20": "Town Hall Meeting",
    "2024-06-02": "Annual Charity Gala",
  };

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

  return (
    <div className="w-full max-w-6xl bg-white rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 border border-stone-100 shadow-sm">
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
            const hasEvent = Boolean(events[fullDate]);
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
                {hasEvent && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-2 ${selected ? "bg-stone-300" : "bg-amber-500"}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Read-Only Sidebar */}
      <aside className="bg-stone-50/50 border-l border-stone-100 p-8 lg:p-10 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <CalendarIcon size={20} className="text-stone-400" />
          <h3 className="text-lg font-serif font-medium text-stone-800">
            Event Details
          </h3>
        </div>

        {selectedDate ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">
                Selected Date
              </span>
              <p className="text-stone-700 font-medium">{selectedDate}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-2">
                Scheduled Activity
              </span>
              <p className="text-stone-600 leading-relaxed">
                {events[selectedDate] || "No events scheduled for this date."}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-stone-400 text-sm italic">
              Select a date to view scheduled community events.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
