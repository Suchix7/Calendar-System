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
  Clock,
  Sparkles,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import api from "../api/axios";
import NepaliDate from "nepali-date-converter";
import DailyVerse from "./DailyVerse";
import EventGroupsViewer from "./EventGroupsViewer";

// Helper component to format text with clickable links (Markdown [Title](URL) & Raw URLs)
function FormattedText({ text, className = "" }) {
  if (!text) return null;

  const parseContent = (content) => {
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|www\.[^\s)]+)\)|(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const elements = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const matchStart = match.index;
      const matchEnd = regex.lastIndex;

      // Text before match
      if (matchStart > lastIndex) {
        elements.push(content.substring(lastIndex, matchStart));
      }

      if (match[1] && match[2]) {
        // Markdown format [Label](URL)
        const label = match[1];
        let url = match[2];
        if (url.startsWith("www.")) url = "https://" + url;
        elements.push(
          <a
            key={`md-link-${matchStart}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-red-600 dark:text-red-400 font-semibold underline underline-offset-2 hover:text-red-700 dark:hover:text-red-300 break-all inline-flex items-center gap-0.5 mx-0.5 cursor-pointer"
          >
            {label}
            <ExternalLink size={12} className="inline flex-shrink-0" />
          </a>
        );
      } else if (match[3]) {
        // Plain URL
        let url = match[3];
        let displayUrl = url;
        if (url.endsWith(".") || url.endsWith(",") || url.endsWith(")")) {
          url = url.slice(0, -1);
          displayUrl = url;
        }
        const href = url.startsWith("www.") ? `https://${url}` : url;
        elements.push(
          <a
            key={`raw-url-${matchStart}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-red-600 dark:text-red-400 font-semibold underline underline-offset-2 hover:text-red-700 dark:hover:text-red-300 break-all inline-flex items-center gap-0.5 mx-0.5 cursor-pointer"
          >
            {displayUrl}
            <ExternalLink size={12} className="inline flex-shrink-0" />
          </a>
        );
      }

      lastIndex = matchEnd;
    }

    if (lastIndex < content.length) {
      elements.push(content.substring(lastIndex));
    }

    return elements;
  };

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {parseContent(text)}
    </div>
  );
}

export default function ReadOnlyCalendar() {
  const detailsRef = useRef(null);
  const npToday = useMemo(() => new NepaliDate(), []);
  const [currentMonth, setCurrentMonth] = useState(npToday.getMonth());
  const [currentYear, setCurrentYear] = useState(npToday.getYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalEventIndex, setActiveModalEventIndex] = useState(0);

  // Today's AD format string to match against calendar cells
  const todayAdFullDate = useMemo(() => {
    const adObj = npToday.getAD();
    return `${adObj.year}-${String(adObj.month + 1).padStart(2, "0")}-${String(adObj.date).padStart(2, "0")}`;
  }, [npToday]);

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/api/events");
        setEvents(res.data || {});
      } catch (err) {
        console.error("Public fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCalendarData();
  }, []);

  // Helper to extract non-empty events list for any date formatted as { title, details, groups }
  const getPublicEventsList = (date) => {
    if (!date) return [];
    const val = events[date];
    if (Array.isArray(val)) {
      return val
        .map((item, idx) => {
          if (typeof item === "object" && item !== null) {
            const details = (typeof item.details === "string" ? item.details : typeof item.note === "string" ? item.note : "").trim();
            const rawTitle = typeof item.title === "string" ? item.title.trim() : "";
            const title = rawTitle || `Event ${idx + 1}`;
            const groups = Array.isArray(item.groups) ? item.groups : [];
            const hasGroups = groups.some((g) => g && (g.name?.trim() || (Array.isArray(g.items) && g.items.length > 0)));
            const isMeaningful = details.length > 0 || hasGroups || (rawTitle.length > 0 && rawTitle !== `Event ${idx + 1}`);
            if (!isMeaningful) return null;
            return { title, details, groups };
          }
          if (typeof item === "string" && item.trim().length > 0) {
            return {
              title: `Event ${idx + 1}`,
              details: item.trim(),
              groups: [],
            };
          }
          return null;
        })
        .filter(Boolean);
    }
    if (typeof val === "string" && val.trim().length > 0) {
      return [{ title: "Event 1", details: val.trim(), groups: [] }];
    }
    if (typeof val === "object" && val !== null) {
      const details = (typeof val.details === "string" ? val.details : "").trim();
      const title = (typeof val.title === "string" ? val.title.trim() : "") || "Event 1";
      const groups = Array.isArray(val.groups) ? val.groups : [];
      const hasGroups = groups.some((g) => g && (g.name?.trim() || (Array.isArray(g.items) && g.items.length > 0)));
      if (details.length > 0 || hasGroups || (typeof val.title === "string" && val.title.trim().length > 0 && title !== "Event 1")) {
        return [{ title, details, groups }];
      }
    }
    return [];
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results = [];

    for (const [dateKey, val] of Object.entries(events)) {
      const list = getPublicEventsList(dateKey);
      const matched = list.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(query);
        const detailsMatch = item.details.toLowerCase().includes(query);
        const groupsMatch = Array.isArray(item.groups) && item.groups.some((g) => {
          const gName = (g.name || "").toLowerCase();
          const itemsMatch = Array.isArray(g.items) && g.items.some((it) => it.toLowerCase().includes(query));
          return gName.includes(query) || itemsMatch;
        });
        return titleMatch || detailsMatch || groupsMatch;
      });
      if (matched.length > 0) {
        results.push({
          dateKey,
          matched,
          all: list,
        });
      }
    }

    return results.sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));
  }, [searchQuery, events]);

  const days = ["आइत", "सोम", "मङ्गल", "बुध", "बिही", "शुक्र", "शनि"];

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

  const handleDateSelect = (fullDate) => {
    setSelectedDate(fullDate);
    // Smoothly scroll down to the events section
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const openCardExpand = (idx = 0) => {
    setActiveModalEventIndex(idx);
    setIsModalOpen(true);
  };

  const activeEventList = getPublicEventsList(selectedDate);
  const currentExpandedEvent = activeEventList[activeModalEventIndex] || activeEventList[0] || null;

  return (
    <div className="relative w-full max-w-6xl mx-auto px-2 sm:px-4">
      <div className="w-full bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 border border-gray-100 dark:border-gray-800 shadow-sm relative transition-colors">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        )}

        {/* Main Calendar Section */}
        <div className="lg:col-span-2 p-3.5 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
            <h2 className="text-lg sm:text-2xl flex items-baseline gap-2 font-serif font-medium text-gray-900 dark:text-gray-100">
              {monthName}{" "}
              <span className="text-gray-500 dark:text-gray-400 font-sans font-light text-base sm:text-xl">
                {yearNp}
              </span>
              {overlappingAdMonths && (
                <span className="text-gray-400 dark:text-gray-500 font-sans font-medium text-xs sm:text-sm">
                  ({overlappingAdMonths})
                </span>
              )}
            </h2>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handlePrev}
                className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-800 hover:border-red-100 dark:hover:border-gray-600 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-400 transition-colors active:scale-95"
                title="Previous Month"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNext}
                className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-800 hover:border-red-100 dark:hover:border-gray-600 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-400 transition-colors active:scale-95"
                title="Next Month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2 sm:mb-4">
            {days.map((d, index) => (
              <div
                key={d}
                className={`text-center text-[10px] sm:text-xs uppercase tracking-wider font-bold leading-none truncate px-0.5 ${
                  index === 6 ? "text-red-600" : "text-gray-400 dark:text-gray-500"
                }`}
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
              const hasEvents = getPublicEventsList(fullDate).length > 0;
              const selected = selectedDate === fullDate;
              const isToday = fullDate === todayAdFullDate;

              return (
                <button
                  key={fullDate}
                  onClick={() => handleDateSelect(fullDate)}
                  className={`relative p-1.5 sm:p-3 rounded-xl sm:rounded-2xl text-sm transition-all flex flex-col items-center justify-center min-h-[54px] sm:min-h-[80px] border active:scale-95 ${
                    selected
                      ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-200/50 dark:shadow-none"
                      : isToday
                      ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-100/80 dark:hover:bg-red-950/50"
                      : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-100 dark:hover:border-gray-700"
                  }`}
                >
                  <span
                    className={`text-base sm:text-xl ${
                      selected ? "font-bold" : isToday ? "font-bold" : "font-semibold"
                    } ${!selected && npDate.getDay() === 6 ? "text-red-500" : ""}`}
                  >
                    {npDate.format("D", "np")}
                  </span>
                  <span
                    className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 text-[8px] sm:text-xs font-sans ${
                      selected
                        ? "text-red-100"
                        : isToday
                        ? "text-red-400 dark:text-red-500"
                        : npDate.getDay() === 6
                        ? "text-red-300 dark:text-red-900/80"
                        : "text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    {adDateObj.date}
                  </span>
                  {hasEvents && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full absolute bottom-1 left-1.5 sm:bottom-2 sm:left-2 ${
                        selected ? "bg-white" : "bg-green-500 dark:bg-green-600 shadow-sm shadow-green-500/50"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Read-Only Sidebar */}
        <aside
          ref={detailsRef}
          className="bg-gray-50/70 dark:bg-gray-900/50 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 p-4 sm:p-6 lg:p-8 flex flex-col scroll-mt-6"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div className="flex items-center gap-2">
              <CalendarIcon size={19} className="text-red-500" />
              <h3 className="text-base sm:text-lg font-serif font-medium text-gray-800 dark:text-gray-200">
                Event Details
              </h3>
            </div>
            {selectedDate && activeEventList.length > 0 && (
              <span className="text-[11px] sm:text-xs bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold px-2.5 py-1 rounded-full">
                {activeEventList.length} {activeEventList.length === 1 ? "Event" : "Events"}
              </span>
            )}
          </div>

          {/* Global Search Bar */}
          <div className="mb-4 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={15}
            />
            <input
              type="text"
              placeholder="Search services, events, links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-9 pr-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {searchQuery.trim() ? (
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[460px]">
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 block mb-1">
                Search Results ({searchResults.length})
              </span>
              {searchResults.length > 0 ? (
                searchResults.map(({ dateKey, matched }) => (
                  <button
                    key={dateKey}
                    onClick={() => {
                      handleDateSelect(dateKey);
                      setSearchQuery("");
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-800/60 transition-all shadow-sm focus:outline-none group active:scale-98"
                  >
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center justify-between">
                      {getSelectedBsDateString(dateKey)}
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {matched.map((evt, idx) => (
                        <div
                          key={`search-evt-${idx}`}
                          className="text-xs bg-gray-50 dark:bg-gray-900/60 p-2 rounded-lg border border-gray-100/80 dark:border-gray-700/50"
                        >
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{evt.title}</p>
                          {evt.details && (
                            <FormattedText text={evt.details} className="text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5" />
                          )}
                        </div>
                      ))}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-6">
                  No events found matching "{searchQuery}"
                </p>
              )}
            </div>
          ) : selectedDate ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col space-y-3.5"
            >
              <div className="bg-white dark:bg-gray-800/80 p-3 rounded-xl border border-gray-200/70 dark:border-gray-700">
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 block">
                  Selected Date
                </span>
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-base sm:text-lg">
                  {getSelectedBsDateString(selectedDate)}
                </p>
              </div>

              {activeEventList.length > 0 ? (
                <div className="flex-1 flex flex-col space-y-2.5 max-h-[440px] overflow-y-auto pr-0.5">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    Tap any event card to view its full details
                  </span>
                  {activeEventList.map((evt, idx) => (
                    <div
                      key={`pub-event-${idx}`}
                      onClick={() => openCardExpand(idx)}
                      className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700 shadow-sm hover:border-red-400 dark:hover:border-red-700 hover:shadow-md transition-all group cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-5 h-5 flex-shrink-0 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                            {evt.title}
                          </h4>
                        </div>
                        <div className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors flex-shrink-0">
                          <Maximize2 size={13} />
                        </div>
                      </div>
                      {evt.details && (
                        <FormattedText
                          text={evt.details}
                          className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed pl-6 line-clamp-3"
                        />
                      )}
                      {evt.groups && evt.groups.length > 0 && (
                        <div className="pl-6 pt-1">
                          <EventGroupsViewer
                            groups={evt.groups}
                            defaultExpanded={false}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 text-center flex flex-col items-center justify-center py-8">
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                    No public events scheduled for this date.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 sm:py-14">
              <CalendarIcon className="w-10 h-10 text-gray-300 dark:text-gray-700 mb-2.5" />
              <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm italic">
                Select a date to view scheduled community events.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Full-Screen Modal - Displaying ONLY the expanded card with clickable links & groups */}
      <AnimatePresence>
        {isModalOpen && selectedDate && currentExpandedEvent && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 md:p-8">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 z-10"
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/60 flex-shrink-0">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 font-bold text-[11px] sm:text-xs whitespace-nowrap">
                      Event {activeModalEventIndex + 1}
                    </span>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 truncate">
                      Full Expanded View
                    </p>
                  </div>
                  <h4 className="font-serif text-base sm:text-xl text-gray-900 dark:text-gray-100 mt-1 truncate">
                    {getSelectedBsDateString(selectedDate)}
                  </h4>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body: Displays ONLY the clicked event with full formatted links & nested groups */}
              <div className="p-5 sm:p-8 overflow-y-auto space-y-4 flex-1">
                <div className="p-5 sm:p-6 rounded-2xl bg-gray-50/70 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/80">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-7 h-7 rounded-full bg-red-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {activeModalEventIndex + 1}
                    </span>
                    <h5 className="font-serif font-semibold text-gray-900 dark:text-gray-100 text-lg sm:text-xl">
                      {currentExpandedEvent.title}
                    </h5>
                  </div>
                  {currentExpandedEvent.details ? (
                    <FormattedText
                      text={currentExpandedEvent.details}
                      className="text-gray-800 dark:text-gray-200 text-base sm:text-lg leading-relaxed pl-9"
                    />
                  ) : !currentExpandedEvent.groups || currentExpandedEvent.groups.length === 0 ? (
                    <p className="text-gray-400 dark:text-gray-500 italic pl-9 text-sm">
                      No additional notes for this event.
                    </p>
                  ) : null}

                  {/* Collapsible Nested Groups in Expanded Modal */}
                  {currentExpandedEvent.groups && currentExpandedEvent.groups.length > 0 && (
                    <div className="pl-0 sm:pl-9 pt-3">
                      <EventGroupsViewer
                        groups={currentExpandedEvent.groups}
                        defaultExpanded={true}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-3.5 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60 flex justify-end flex-shrink-0">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-sm text-sm active:scale-98"
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
