import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  X,
  Maximize2,
  Search,
} from "lucide-react";
import api from "../api/axios";
import NepaliDate from "nepali-date-converter";
import DailyVerse from "./DailyVerse";

export default function ReadOnlyCalendar() {
  const detailsRef = useRef(null);
  const npToday = useMemo(() => new NepaliDate(), []);
  const [currentMonth, setCurrentMonth] = useState(npToday.getMonth());
  const [currentYear, setCurrentYear] = useState(npToday.getYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    
    // Find all events that match string dynamically
    return Object.entries(events)
      .filter(([_, desc]) => desc.toLowerCase().includes(query))
      .sort((a, b) => new Date(a[0]) - new Date(b[0]));
  }, [searchQuery, events]);

  // Today's AD format string to match against calendar cells
  const todayAdFullDate = useMemo(() => {
    const adObj = npToday.getAD();
    return `${adObj.year}-${String(adObj.month + 1).padStart(2, "0")}-${String(adObj.date).padStart(2, "0")}`;
  }, [npToday]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const days = ["आइत", "सोम", "मङ्गल", "बुध", "बिही", "शुक्र", "शनि"];

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
    () => new NepaliDate(currentYear, currentMonth, 1).getDay(),
    [currentMonth, currentYear],
  );
  const daysInMonth = useMemo(
    () => new NepaliDate(currentYear, currentMonth + 1, 0).getDate(),
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

  const activeEventContent =
    events[selectedDate] || "No public events scheduled for this date.";

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="w-full bg-white dark:bg-gray-900 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 border border-gray-100 dark:border-gray-800 shadow-sm relative transition-colors">
        {/* Loading Overlay */}
        {isLoading && (
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
              const hasEvent = Boolean(events[fullDate]);
              const selected = selectedDate === fullDate;
              const isToday = fullDate === todayAdFullDate;

              return (
                <button
                  key={fullDate}
                  onClick={() => {
                    setSelectedDate(fullDate);
                    if (hasEvent) {
                      setTimeout(() => {
                        detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 100);
                    }
                  }}
                  className={`relative p-1 sm:p-3 rounded-xl sm:rounded-2xl text-sm transition-all flex flex-col items-center justify-center min-h-[56px] sm:min-h-[80px] border ${
                    selected
                      ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-200/50 dark:shadow-none"
                      : isToday
                      ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-100/80 dark:hover:bg-red-950/50"
                      : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-100 dark:hover:border-gray-700"
                  }`}
                >
                  <span className={`text-base sm:text-xl ${selected ? "font-bold" : isToday ? "font-bold" : "font-medium"} ${!selected && npDate.getDay() === 6 ? "text-red-500" : ""}`}>
                    {npDate.format("D", "np")}
                  </span>
                  <span className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 text-[8px] sm:text-xs font-sans ${selected ? "text-red-100" : isToday ? "text-red-400 dark:text-red-500" : npDate.getDay() === 6 ? "text-red-300 dark:text-red-900/80" : "text-gray-400 dark:text-gray-600"}`}>
                    {adDateObj.date}
                  </span>
                  {hasEvent && (
                    <div
                      className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full absolute bottom-1 left-1.5 sm:bottom-2 sm:left-2 ${selected ? "bg-white" : "bg-green-500 dark:bg-green-600"}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Read-Only Sidebar */}
        <aside ref={detailsRef} className="bg-gray-50/50 dark:bg-gray-900/50 border-l border-gray-100 dark:border-gray-800 p-5 sm:p-8 lg:p-10 flex flex-col scroll-mt-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <CalendarIcon size={20} className="text-red-500" />
            <h3 className="text-lg font-serif font-medium text-gray-800 dark:text-gray-200">
              Event Details
            </h3>
          </div>

          {/* Global Search Bar */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search local events..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {searchQuery.trim() ? (
            <div className="flex-1 overflow-y-auto space-y-3">
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 block mb-2">Search Results</span>
              {searchResults.length > 0 ? (
                searchResults.map(([dateAd, desc]) => (
                  <button 
                    key={dateAd}
                    onClick={() => {
                      setSelectedDate(dateAd);
                      setSearchQuery("");
                    }}
                    className="w-full text-left p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900/50 transition-colors shadow-sm focus:outline-none"
                  >
                    <p className="text-xs font-bold text-red-500 flex items-center justify-between">
                      {getSelectedBsDateString(dateAd)}
                    </p>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{desc}</p>
                  </button>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-4">No events found matching "{searchQuery}"</p>
              )}
            </div>
          ) : selectedDate ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
                  Selected Date
                </span>
                <p className="text-gray-800 dark:text-gray-200 font-medium text-lg">{getSelectedBsDateString(selectedDate)}</p>
              </div>

              <div
                onDoubleClick={() => setIsModalOpen(true)}
                className="group relative p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm cursor-zoom-in hover:border-red-200 dark:hover:border-red-900/50 transition-all"
                title="Double tap to expand"
              >
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 block mb-2">
                  Scheduled Activity
                </span>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic whitespace-pre-wrap line-clamp-[10]">
                  {activeEventContent}
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Maximize2 size={12} />
                  View Full Details
                </button>
              </div>
            </motion.div>

          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-gray-400 dark:text-gray-500 text-sm italic">
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
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <div>
                  <h4 className="font-serif text-xl text-gray-900 dark:text-gray-100">
                    {getSelectedBsDateString(selectedDate)}
                  </h4>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-red-500">
                    Scheduled Event
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
                  {activeEventContent}
                </p>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm"
                >

                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <DailyVerse />
    </div>
  );
}
