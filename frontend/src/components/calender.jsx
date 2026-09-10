import React, { useState, useMemo, useEffect, useRef } from "react";
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
  Plus,
  Clock,
  Sparkles,
  Edit3,
  Globe,
} from "lucide-react";
import api from "../api/axios";
import NepaliDate from "nepali-date-converter";
import EventGroupsEditor from "./EventGroupsEditor";

const DEFAULT_GLOBAL_NAMES = [
  "Main Worship Service",
  "Sunday School",
  "Youth Fellowship",
];

export default function AdminCalendar() {
  const detailsRef = useRef(null);
  const npToday = useMemo(() => new NepaliDate(), []);
  const [currentMonth, setCurrentMonth] = useState(npToday.getMonth());
  const [currentYear, setCurrentYear] = useState(npToday.getYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [notes, setNotes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Global Section Names (applies to the 3 main event sections across all days)
  const [globalSectionNames, setGlobalSectionNames] = useState(() => {
    try {
      const saved = localStorage.getItem("church_global_sections");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_GLOBAL_NAMES;
  });

  // Fullscreen Modal state: which event index (or null) is being edited in fullscreen
  const [fullscreenEventIndex, setFullscreenEventIndex] = useState(null);
  const isModalOpen = fullscreenEventIndex !== null;

  // Today's AD format string to match against calendar cells
  const todayAdFullDate = useMemo(() => {
    const adObj = npToday.getAD();
    return `${adObj.year}-${String(adObj.month + 1).padStart(2, "0")}-${String(adObj.date).padStart(2, "0")}`;
  }, [npToday]);

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setIsFetching(true);
        const [eventsRes, settingsRes] = await Promise.allSettled([
          api.get("/api/events"),
          api.get("/api/settings/global_event_sections"),
        ]);

        if (eventsRes.status === "fulfilled") {
          setNotes(eventsRes.value.data || {});
        }
        if (settingsRes.status === "fulfilled" && Array.isArray(settingsRes.value.data)) {
          setGlobalSectionNames(settingsRes.value.data);
          try {
            localStorage.setItem("church_global_sections", JSON.stringify(settingsRes.value.data));
          } catch (e) {}
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchCalendarData();
  }, []);

  // Lock background scrolling on mobile & desktop when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const debounceTimerRef = useRef(null);

  // Update a global section name (Section 1, 2, or 3)
  const handleGlobalNameChange = (index, newName) => {
    if (index < 3) {
      const updatedGlobal = [...globalSectionNames];
      while (updatedGlobal.length < 3) {
        updatedGlobal.push(`Event ${updatedGlobal.length + 1}`);
      }
      updatedGlobal[index] = newName;
      setGlobalSectionNames(updatedGlobal);
      try {
        localStorage.setItem("church_global_sections", JSON.stringify(updatedGlobal));
        // Debounce backend sync
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          api.post("/api/settings/global_event_sections", { value: updatedGlobal }).catch(() => {});
        }, 800);
      } catch (e) {}
    } else if (selectedDate) {
      // 4th+ events are specific to this date
      const currentList = [...getEventList(selectedDate)];
      currentList[index] = {
        ...currentList[index],
        title: newName,
      };
      setNotes((prev) => ({
        ...prev,
        [selectedDate]: currentList,
      }));
    }
  };

  // Helper to normalize events for a date into an array of { title, details, groups } with at least 3 slots
  const getEventList = (date) => {
    if (!date) {
      return [
        { title: globalSectionNames[0] || "Event 1", details: "", groups: [] },
        { title: globalSectionNames[1] || "Event 2", details: "", groups: [] },
        { title: globalSectionNames[2] || "Event 3", details: "", groups: [] },
      ];
    }
    const val = notes[date];
    let list = [];

    if (Array.isArray(val)) {
      list = val.map((item, idx) => {
        const defaultTitle = idx < 3 ? (globalSectionNames[idx] || `Event ${idx + 1}`) : `Event ${idx + 1}`;
        if (typeof item === "object" && item !== null) {
          return {
            title: idx < 3 ? (globalSectionNames[idx] || defaultTitle) : (item.title || defaultTitle),
            details: typeof item.details === "string" ? item.details : item.note || "",
            groups: Array.isArray(item.groups) ? item.groups : [],
          };
        }
        if (typeof item === "string") {
          return {
            title: defaultTitle,
            details: item,
            groups: [],
          };
        }
        return { title: defaultTitle, details: "", groups: [] };
      });
    } else if (typeof val === "string" && val.trim().length > 0) {
      list = [{ title: globalSectionNames[0] || "Event 1", details: val, groups: [] }];
    } else if (typeof val === "object" && val !== null) {
      list = [{
        title: globalSectionNames[0] || val.title || "Event 1",
        details: typeof val.details === "string" ? val.details : "",
        groups: Array.isArray(val.groups) ? val.groups : [],
      }];
    }

    // Pad to at least 3 items with global section names
    while (list.length < 3) {
      list.push({ title: globalSectionNames[list.length] || `Event ${list.length + 1}`, details: "", groups: [] });
    }

    return list;
  };

  // Check if a date has any stored event details or groups
  const checkHasEvent = (date) => {
    const val = notes[date];
    if (!val) return false;
    if (Array.isArray(val)) {
      return val.some((item) => {
        if (typeof item === "object" && item !== null) {
          const hasDetails = typeof item.details === "string" && item.details.trim().length > 0;
          const hasGroups = Array.isArray(item.groups) && item.groups.some((g) => g.name?.trim() || (Array.isArray(g.items) && g.items.length > 0));
          return hasDetails || hasGroups;
        }
        return typeof item === "string" && item.trim().length > 0;
      });
    }
    if (typeof val === "string") {
      return val.trim().length > 0;
    }
    if (typeof val === "object" && val !== null) {
      const hasDetails = Boolean(val.details?.trim());
      const hasGroups = Array.isArray(val.groups) && val.groups.some((g) => g.name?.trim() || (Array.isArray(g.items) && g.items.length > 0));
      return hasDetails || hasGroups;
    }
    return false;
  };

  const handleDetailsChange = (index, newDetails) => {
    if (!selectedDate) return;
    const currentList = [...getEventList(selectedDate)];
    currentList[index] = {
      ...currentList[index],
      details: newDetails,
    };
    setNotes((prev) => ({
      ...prev,
      [selectedDate]: currentList,
    }));
  };

  const handleGroupsChange = (index, newGroups) => {
    if (!selectedDate) return;
    const currentList = [...getEventList(selectedDate)];
    currentList[index] = {
      ...currentList[index],
      groups: newGroups,
    };
    setNotes((prev) => ({
      ...prev,
      [selectedDate]: currentList,
    }));
  };

  const handleAddEventSlot = () => {
    if (!selectedDate) return;
    const currentList = [...getEventList(selectedDate)];
    currentList.push({
      title: `Extra Event ${currentList.length - 2}`,
      details: "",
      groups: [],
    });
    setNotes((prev) => ({
      ...prev,
      [selectedDate]: currentList,
    }));
  };

  const handleRemoveEventSlot = (indexToRemove) => {
    if (!selectedDate) return;
    const currentList = [...getEventList(selectedDate)];
    if (indexToRemove < 3) {
      // For the first 3 default sections, clear the details and groups
      currentList[indexToRemove] = {
        title: globalSectionNames[indexToRemove] || `Event ${indexToRemove + 1}`,
        details: "",
        groups: [],
      };
    } else {
      currentList.splice(indexToRemove, 1);
    }
    setNotes((prev) => ({
      ...prev,
      [selectedDate]: currentList,
    }));
    if (fullscreenEventIndex === indexToRemove) {
      setFullscreenEventIndex(null);
    } else if (fullscreenEventIndex > indexToRemove) {
      setFullscreenEventIndex((prev) => prev - 1);
    }
  };

  const handleDateSelect = (fullDate) => {
    setSelectedDate(fullDate);
    // Smoothly scroll to the admin controls / events section
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setIsLoading(true);
    try {
      const rawList = getEventList(selectedDate);
      // Clean list: keep items that have details or non-empty groups
      const cleanedList = rawList
        .map((item, idx) => ({
          title: idx < 3 ? (globalSectionNames[idx] || `Event ${idx + 1}`) : (item.title || `Event ${idx + 1}`),
          details: item.details?.trim() || "",
          groups: Array.isArray(item.groups)
            ? item.groups
                .filter((g) => g && (g.name?.trim() || (Array.isArray(g.items) && g.items.length > 0)))
                .map((g) => ({
                  name: g.name?.trim() || "Group",
                  items: Array.isArray(g.items) ? g.items.map((it) => it.trim()).filter(Boolean) : [],
                }))
            : [],
        }))
        .filter((item) => item.details.length > 0 || (item.groups && item.groups.length > 0));

      await api.post("/api/events", {
        date: selectedDate,
        note: cleanedList,
      });
      alert("Saved successfully!");
      setFullscreenEventIndex(null);
    } catch (err) {
      console.error("Save error:", err);
      alert("Unauthorized or failed to save. Please log in again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!selectedDate) return;
    if (!window.confirm("Are you sure you want to delete all events for this date?")) return;

    try {
      await api.delete(`/api/events/${selectedDate}`);
      const updatedNotes = { ...notes };
      delete updatedNotes[selectedDate];
      setNotes(updatedNotes);
      setFullscreenEventIndex(null);
      alert("Events deleted!");
    } catch (err) {
      console.error("Error deleting:", err);
      alert(err.response?.data?.error || "Failed to delete.");
    }
  };

  // --- Calendar Navigation & Calculation ---
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

  const selectedEvents = getEventList(selectedDate);
  const activeModalEvent = selectedEvents[fullscreenEventIndex ?? 0] || {
    title: "",
    details: "",
  };

  return (
    <div className="relative w-full">
      <div className="w-full bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 border border-gray-100 dark:border-gray-800 shadow-sm relative transition-colors">
        {isFetching && (
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
              const hasEvents = checkHasEvent(fullDate);
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

        {/* Admin Sidebar / Controls */}
        <aside
          ref={detailsRef}
          className="bg-gray-50/70 dark:bg-gray-900/50 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 p-4 sm:p-6 lg:p-8 flex flex-col scroll-mt-6"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div className="flex items-center gap-2">
              <CalendarIcon size={19} className="text-red-500" />
              <h3 className="text-base sm:text-lg font-serif font-medium text-gray-800 dark:text-gray-200">
                Admin Controls
              </h3>
            </div>
            {selectedDate && (
              <span className="text-[11px] sm:text-xs bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold px-2.5 py-1 rounded-full">
                {selectedEvents.length} Sections
              </span>
            )}
          </div>

          {selectedDate ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col space-y-4"
            >
              <div className="bg-white dark:bg-gray-800/80 p-3 rounded-xl border border-gray-200/70 dark:border-gray-700">
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 block">
                  Selected Date
                </span>
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-base sm:text-lg">
                  {getSelectedBsDateString(selectedDate)}
                </p>
              </div>

              {/* Multiple Event Sections */}
              <div className="flex-1 flex flex-col space-y-3.5 max-h-[480px] overflow-y-auto pr-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-red-500" />
                    Event Sections
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Globe size={11} className="text-red-500" /> Global Titles
                  </span>
                </div>

                {selectedEvents.map((evt, index) => {
                  const isGlobalSection = index < 3;
                  const currentTitle = isGlobalSection
                    ? (globalSectionNames[index] || `Section ${index + 1}`)
                    : (evt.title || `Extra Event ${index - 2}`);

                  return (
                    <div
                      key={`event-section-${index}`}
                      className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm focus-within:border-red-400 dark:focus-within:border-red-500 transition-all group"
                    >
                      {/* Globally Synchronized Event Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-5 h-5 flex-shrink-0 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={currentTitle}
                              onChange={(e) => handleGlobalNameChange(index, e.target.value)}
                              placeholder={`Section ${index + 1} Title`}
                              className="w-full text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 hover:border-red-400 focus:border-red-500 focus:outline-none py-0.5 pr-5 transition-colors placeholder:text-gray-400"
                              title={isGlobalSection ? "Editing this title updates it globally for all days" : "Title for this specific date"}
                            />
                            <Edit3 size={11} className="absolute right-0.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setFullscreenEventIndex(index)}
                            className="p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Open Fullscreen Expanded View"
                          >
                            <Maximize2 size={14} />
                          </button>
                          <button
                            onClick={() => handleRemoveEventSlot(index)}
                            className="p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title={isGlobalSection ? "Clear details for this date" : "Remove this extra event"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        onDoubleClick={() => setFullscreenEventIndex(index)}
                        className="w-full p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/80 bg-gray-50/60 dark:bg-gray-900/60 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/50 focus:border-red-300 dark:focus:border-gray-600 outline-none resize-none text-xs sm:text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:italic transition-all"
                        placeholder={`Details for ${currentTitle} on this date (e.g. 10:00 AM, Speaker, Scripture)...`}
                        value={evt.details || ""}
                        onChange={(e) => handleDetailsChange(index, e.target.value)}
                      />

                      {/* Nested Groups / Roster Editor */}
                      <EventGroupsEditor
                        groups={evt.groups || []}
                        onChange={(newG) => handleGroupsChange(index, newG)}
                      />

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setFullscreenEventIndex(index)}
                          className="text-[10px] text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                        >
                          <Maximize2 size={10} /> Full expand view
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* + Add Another Event Button */}
                <button
                  onClick={handleAddEventSlot}
                  className="w-full py-3 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 rounded-2xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <Plus size={15} />
                  Add Another Event Section for this Date
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-50 shadow-md shadow-red-200 dark:shadow-none active:scale-98"
                >
                  <Save size={16} /> {isLoading ? "Saving..." : "Save Events for this Date"}
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/40 transition-all active:scale-98"
                >
                  <Trash2 size={14} /> Delete All Events for Date
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 sm:py-14">
              <CalendarIcon className="w-10 h-10 text-gray-300 dark:text-gray-700 mb-2.5" />
              <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm italic">
                Select a date from the calendar to create or modify events.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Single-Card Fullscreen Modal - Clean and focused ONLY on the clicked section */}
      <AnimatePresence>
        {isModalOpen && selectedDate && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 md:p-8 overscroll-contain">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFullscreenEventIndex(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md touch-none"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-3xl h-[92dvh] max-h-[92dvh] sm:h-[85vh] sm:max-h-[850px] bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 z-10 overscroll-contain"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/60 flex-shrink-0">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 font-bold text-[11px] sm:text-xs whitespace-nowrap">
                      Section {(fullscreenEventIndex ?? 0) + 1}
                    </span>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 truncate">
                      Full Expanded Editor
                    </p>
                  </div>
                  <h4 className="font-serif text-base sm:text-xl text-gray-900 dark:text-gray-100 mt-1 truncate">
                    {getSelectedBsDateString(selectedDate)}
                  </h4>
                </div>

                <button
                  onClick={() => setFullscreenEventIndex(null)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body: Focuses ONLY on this specific section */}
              <div className="flex-1 p-4 sm:p-7 flex flex-col gap-4 overflow-y-auto overscroll-contain touch-pan-y">
                {/* Event Name Input */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Edit3 size={13} className="text-red-500" />
                      Section Title
                    </span>
                    {(fullscreenEventIndex ?? 0) < 3 && (
                      <span className="text-[10px] text-gray-400">
                        (Global title for all days)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={
                      (fullscreenEventIndex ?? 0) < 3
                        ? (globalSectionNames[fullscreenEventIndex ?? 0] || `Section ${(fullscreenEventIndex ?? 0) + 1}`)
                        : (activeModalEvent.title || `Extra Event ${(fullscreenEventIndex ?? 0) - 2}`)
                    }
                    onChange={(e) =>
                      handleGlobalNameChange(fullscreenEventIndex ?? 0, e.target.value)
                    }
                    placeholder="e.g. Main Worship Service, Sunday School, Youth Fellowship"
                    className="w-full p-3 sm:p-3.5 text-sm sm:text-base font-semibold border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/40 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/50 focus:border-red-400 dark:focus:border-gray-600 outline-none text-gray-800 dark:text-gray-100 transition-all"
                  />
                </div>

                {/* Event Details Textarea */}
                <div className="flex-1 flex flex-col min-h-[140px]">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-1 flex items-center gap-1.5">
                    <Clock size={13} className="text-red-500" />
                    Details & Notes for this Date
                  </label>
                  <textarea
                    className="w-full flex-1 p-4 sm:p-5 text-sm sm:text-base border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-800/40 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/50 focus:border-red-400 dark:focus:border-gray-600 outline-none resize-none text-gray-800 dark:text-gray-200 placeholder:italic placeholder-gray-400 dark:placeholder:text-gray-500 leading-relaxed transition-all"
                    placeholder="Type time, pastor/speaker name, scripture verses, instructions for this day..."
                    value={activeModalEvent.details || ""}
                    onChange={(e) =>
                      handleDetailsChange(fullscreenEventIndex ?? 0, e.target.value)
                    }
                  />
                </div>

                {/* Fullscreen Nested Groups / Roster Editor */}
                <EventGroupsEditor
                  groups={activeModalEvent.groups || []}
                  onChange={(newG) =>
                    handleGroupsChange(fullscreenEventIndex ?? 0, newG)
                  }
                />
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/60 flex-shrink-0">
                <button
                  onClick={() => handleRemoveEventSlot(fullscreenEventIndex ?? 0)}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                >
                  {(fullscreenEventIndex ?? 0) < 3 ? "Clear Details" : "Remove Extra Event"}
                </button>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => setFullscreenEventIndex(null)}
                    className="px-3.5 sm:px-5 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 sm:gap-2 px-5 sm:px-7 py-2 bg-red-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-red-700 transition-all shadow-md shadow-red-200 dark:shadow-none active:scale-98"
                  >
                    <Save size={15} />{" "}
                    {isLoading ? "Saving..." : "Save Events for this Date"}
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
