import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  X,
  Maximize2,
} from "lucide-react";
import api from "../api/axios";

export default function ReadOnlyCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/api/events");
        setEvents(res.data);
      } catch (err) {
        console.error("Public fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCalendarData();
  }, []);

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

  const activeEventContent =
    events[selectedDate] || "No public events scheduled for this date.";

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="w-full bg-white rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 border border-stone-100 shadow-sm relative">
        {/* Loading Overlay */}
        {isLoading && (
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
              const hasEvent = Boolean(events[fullDate]);
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
                  {hasEvent && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-2 ${selected ? "bg-stone-300" : "bg-gray-500"}`}
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

              <div
                onDoubleClick={() => setIsModalOpen(true)}
                className="group relative p-5 rounded-2xl bg-white border border-stone-200 shadow-sm cursor-zoom-in hover:border-stone-300 transition-all"
                title="Double tap to expand"
              >
                <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-2">
                  Scheduled Activity
                </span>
                <p className="text-stone-600 leading-relaxed italic whitespace-pre-wrap line-clamp-[10]">
                  {activeEventContent}
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-700"
                >
                  <Maximize2 size={12} />
                  View Full Details
                </button>
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

      {/* Full-Screen Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div>
                  <h4 className="font-serif text-xl text-stone-900">
                    {selectedDate}
                  </h4>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">
                    Scheduled Event
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <p className="text-stone-700 text-lg leading-relaxed whitespace-pre-wrap">
                  {activeEventContent}
                </p>
              </div>

              <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-900 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
