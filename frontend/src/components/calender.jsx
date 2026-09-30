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
  Copy,
  ClipboardPaste,
  CalendarPlus,
  Check,
  AlertCircle,
  AlertTriangle,
  Layers,
  Info,
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

  // Toast / Feedback notification state
  const [feedback, setFeedback] = useState(null);
  const feedbackTimeoutRef = useRef(null);

  const showToast = (message, type = "success") => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedback({ message, type });
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 3800);
  };

  // Section Clipboard state (persisted in localStorage)
  const [copiedSection, setCopiedSection] = useState(() => {
    try {
      const saved = localStorage.getItem("church_copied_event_section");
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasDetails = Boolean(parsed?.details?.trim());
        const hasGroups =
          Array.isArray(parsed?.groups) &&
          parsed.groups.some(
            (g) =>
              g &&
              Array.isArray(g.items) &&
              g.items.some((it) => typeof it === "string" && it.trim().length > 0)
          );
        if (parsed && (hasDetails || hasGroups)) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

  // "Copy to Date" Modal state
  const [copyToDateModal, setCopyToDateModal] = useState({
    isOpen: false,
    sourceIndex: 0,
    sourceTitle: "",
    sourceDetails: "",
    sourceGroups: [],
    sourceDate: null,
    targetDate: null,
    targetMonth: npToday.getMonth(),
    targetYear: npToday.getYear(),
    placementMode: "smart", // "smart" | "append" | "replace"
  });

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
  const isModalOpen = fullscreenEventIndex !== null || copyToDateModal.isOpen;

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

  // Lock background scrolling when modal is open
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

  // Update section title for a specific slot on the selected date
  const handleSectionTitleChange = (index, newTitle) => {
    if (!selectedDate) return;
    const currentList = [...getEventList(selectedDate)];
    while (currentList.length <= index) {
      currentList.push({
        title: `Section ${currentList.length + 1}`,
        details: "",
        groups: [],
      });
    }
    currentList[index] = {
      ...currentList[index],
      title: newTitle,
    };
    setNotes((prev) => ({
      ...prev,
      [selectedDate]: currentList,
    }));
  };

  // Helper to check if a specific event slot is completely empty (no notes, no group items, and no custom title)
  const isSectionEmpty = (evt, index) => {
    if (!evt) return true;
    const hasDetails = typeof evt.details === "string" && evt.details.trim().length > 0;
    const hasGroups =
      Array.isArray(evt.groups) &&
      evt.groups.some(
        (g) =>
          g &&
          Array.isArray(g.items) &&
          g.items.some((it) => typeof it === "string" && it.trim().length > 0)
      );
    const defaultTitle = index < 3 ? (globalSectionNames[index] || `Section ${index + 1}`) : `Section ${index + 1}`;
    const rawTitle = typeof evt.title === "string" ? evt.title.trim() : "";
    const hasCustomTitle = rawTitle.length > 0 && rawTitle !== defaultTitle && !/^Section\s*\d+$/i.test(rawTitle);
    return !hasDetails && !hasGroups && !hasCustomTitle;
  };

  // Helper to normalize events for a date into an array of { title, details, groups } with at least 3 slots
  const getEventList = (date) => {
    if (!date) {
      return [
        { title: globalSectionNames[0] || "Section 1", details: "", groups: [] },
        { title: globalSectionNames[1] || "Section 2", details: "", groups: [] },
        { title: globalSectionNames[2] || "Section 3", details: "", groups: [] },
      ];
    }
    const val = notes[date];
    let list = [];

    if (Array.isArray(val)) {
      list = val.map((item, idx) => {
        const defaultTitle = idx < 3 ? (globalSectionNames[idx] || `Section ${idx + 1}`) : `Section ${idx + 1}`;
        if (typeof item === "object" && item !== null) {
          return {
            title: typeof item.title === "string" ? item.title : defaultTitle,
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
      list = [{ title: globalSectionNames[0] || "Section 1", details: val, groups: [] }];
    } else if (typeof val === "object" && val !== null) {
      list = [{
        title: typeof val.title === "string" ? val.title : (globalSectionNames[0] || "Section 1"),
        details: typeof val.details === "string" ? val.details : "",
        groups: Array.isArray(val.groups) ? val.groups : [],
      }];
    }

    // Pad to at least 3 items with default section names
    while (list.length < 3) {
      list.push({
        title: globalSectionNames[list.length] || `Section ${list.length + 1}`,
        details: "",
        groups: [],
      });
    }

    return list;
  };

  // Check if a date has any stored event details or groups with members or custom title
  const checkHasEvent = (date) => {
    const val = notes[date];
    if (!val) return false;
    if (Array.isArray(val)) {
      return val.some((item, idx) => {
        if (typeof item === "object" && item !== null) {
          const hasDetails = typeof item.details === "string" && item.details.trim().length > 0;
          const hasGroups =
            Array.isArray(item.groups) &&
            item.groups.some(
              (g) =>
                g &&
                Array.isArray(g.items) &&
                g.items.some((it) => typeof it === "string" && it.trim().length > 0)
            );
          const defaultTitle = idx < 3 ? (globalSectionNames[idx] || `Section ${idx + 1}`) : `Section ${idx + 1}`;
          const rawTitle = typeof item.title === "string" ? item.title.trim() : "";
          const hasCustomTitle = rawTitle.length > 0 && rawTitle !== defaultTitle && !/^Section\s*\d+$/i.test(rawTitle);
          return hasDetails || hasGroups || hasCustomTitle;
        }
        return typeof item === "string" && item.trim().length > 0;
      });
    }
    if (typeof val === "string") {
      return val.trim().length > 0;
    }
    if (typeof val === "object" && val !== null) {
      const hasDetails = Boolean(val.details?.trim());
      const hasGroups =
        Array.isArray(val.groups) &&
        val.groups.some(
          (g) =>
            g &&
            Array.isArray(g.items) &&
            g.items.some((it) => typeof it === "string" && it.trim().length > 0)
        );
      const rawTitle = typeof val.title === "string" ? val.title.trim() : "";
      const hasCustomTitle = rawTitle.length > 0 && !/^Section\s*\d+$/i.test(rawTitle) && !/^Event\s*\d+$/i.test(rawTitle);
      return hasDetails || hasGroups || hasCustomTitle;
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
      title: `Section ${currentList.length + 1}`,
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
        title: globalSectionNames[indexToRemove] || `Section ${indexToRemove + 1}`,
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
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // --- QA Enhanced Copy & Paste Handlers ---
  const handleCopySection = (index, customData = null) => {
    if (!selectedDate && !customData) return;
    const currentList = getEventList(selectedDate);
    const target = customData || currentList[index];
    if (!target) return;

    // QA Check: Prevent copying an empty section
    if (isSectionEmpty(target, index)) {
      showToast(`Section ${index + 1} is empty. Add notes or roster groups before copying.`, "warning");
      return;
    }

    const payload = {
      title: target.title || (index < 3 ? (globalSectionNames[index] || `Section ${index + 1}`) : `Section ${index + 1}`),
      details: target.details?.trim() || "",
      groups: Array.isArray(target.groups)
        ? target.groups
            .map((g) => ({
              name: g.name?.trim() || "Group",
              items: Array.isArray(g.items)
                ? g.items.map((it) => (typeof it === "string" ? it.trim() : "")).filter(Boolean)
                : [],
            }))
            .filter((g) => g.items.length > 0)
        : [],
      sourceDate: selectedDate,
      sourceIndex: index,
    };

    setCopiedSection(payload);
    try {
      localStorage.setItem("church_copied_event_section", JSON.stringify(payload));
    } catch (e) {}

    showToast(`Copied Section ${index + 1} ("${payload.title}") to clipboard!`, "success");
  };

  const handlePasteSection = (targetIndex) => {
    if (!selectedDate) {
      showToast("Please select a date first to paste into.", "warning");
      return;
    }
    if (!copiedSection) {
      showToast("Clipboard is empty. Copy an event section first.", "warning");
      return;
    }

    const currentList = [...getEventList(selectedDate)];
    const sectionClone = {
      title: copiedSection.title,
      details: copiedSection.details,
      groups: JSON.parse(JSON.stringify(copiedSection.groups || [])),
    };

    if (targetIndex !== null && targetIndex !== undefined && targetIndex < currentList.length) {
      const existingSlot = currentList[targetIndex];
      const isOccupied = existingSlot && (existingSlot.details?.trim() || (Array.isArray(existingSlot.groups) && existingSlot.groups.length > 0));

      if (isOccupied) {
        const choice = window.confirm(
          `Section ${targetIndex + 1} already has notes/roster.\n\nClick OK to OVERWRITE this slot with "${copiedSection.title}", or CANCEL to keep current content.`
        );
        if (!choice) return;
      }
      currentList[targetIndex] = sectionClone;
      showToast(`Pasted into Section ${targetIndex + 1}! Click "Save Events" to persist.`, "success");
    } else {
      // Append as new section
      currentList.push(sectionClone);
      showToast(`Pasted as new extra section ("${sectionClone.title}")! Click "Save Events" to persist.`, "success");
    }

    setNotes((prev) => ({
      ...prev,
      [selectedDate]: currentList,
    }));
  };

  // Open the "Copy to Date" Dialog with QA validation
  const handleOpenCopyToDateModal = (index, customData = null) => {
    const currentList = getEventList(selectedDate);
    const target = customData || currentList[index];
    if (!target) return;

    // QA Check: Prevent opening modal for an empty section
    if (isSectionEmpty(target, index)) {
      showToast(`Section ${index + 1} is empty. Add notes or roster groups before copying to another date.`, "warning");
      return;
    }

    const sourceTitle = target.title || (index < 3 ? (globalSectionNames[index] || `Section ${index + 1}`) : `Section ${index + 1}`);

    setCopyToDateModal({
      isOpen: true,
      sourceIndex: index,
      sourceTitle,
      sourceDetails: target.details || "",
      sourceGroups: Array.isArray(target.groups) ? JSON.parse(JSON.stringify(target.groups)) : [],
      sourceDate: selectedDate,
      targetDate: null,
      targetMonth: currentMonth,
      targetYear: currentYear,
      placementMode: "smart",
    });
  };

  // Execute Copy to Target Date with collision & empty checks
  const handleExecuteCopyToDate = async () => {
    const { targetDate, sourceDate, sourceIndex, sourceTitle, sourceDetails, sourceGroups, placementMode } = copyToDateModal;
    
    if (!targetDate) {
      showToast("Please pick a target date on the calendar first.", "warning");
      return;
    }

    // QA Check: Prevent copying to the exact same date & slot
    if (targetDate === sourceDate && placementMode !== "append") {
      showToast("Target date is the same as source date. Please select a different target date.", "warning");
      return;
    }

    const payload = {
      title: sourceTitle,
      details: sourceDetails?.trim() || "",
      groups: Array.isArray(sourceGroups)
        ? sourceGroups
            .map((g) => ({
              name: g.name?.trim() || "Group",
              items: Array.isArray(g.items)
                ? g.items.map((it) => (typeof it === "string" ? it.trim() : "")).filter(Boolean)
                : [],
            }))
            .filter((g) => g.items.length > 0)
        : [],
    };

    const targetList = [...getEventList(targetDate)];

    if (placementMode === "smart") {
      // If the corresponding slot index is empty, use it. Otherwise, append as new to avoid overlap!
      const targetSlot = targetList[sourceIndex];
      const isOccupied = targetSlot && (targetSlot.details?.trim() || (Array.isArray(targetSlot.groups) && targetSlot.groups.some((g) => Array.isArray(g.items) && g.items.length > 0)));
      if (!isOccupied && sourceIndex < targetList.length) {
        targetList[sourceIndex] = payload;
      } else {
        targetList.push(payload);
      }
    } else if (placementMode === "append") {
      targetList.push(payload);
    } else if (placementMode === "replace") {
      targetList[sourceIndex] = payload;
    }

    const cleanedList = targetList
      .map((item, idx) => {
        const defaultTitle = idx < 3 ? (globalSectionNames[idx] || `Section ${idx + 1}`) : `Section ${idx + 1}`;
        const rawTitle = typeof item.title === "string" ? item.title.trim() : "";
        const title = rawTitle || defaultTitle;
        const details = typeof item.details === "string" ? item.details.trim() : "";
        const groups = Array.isArray(item.groups)
          ? item.groups
              .map((g) => ({
                name: g.name?.trim() || "Group",
                items: Array.isArray(g.items)
                  ? g.items.map((it) => (typeof it === "string" ? it.trim() : "")).filter(Boolean)
                  : [],
              }))
              .filter((g) => (g.name && g.name.trim().length > 0) || g.items.length > 0)
          : [];
        const hasCustomTitle = rawTitle.length > 0 && rawTitle !== defaultTitle && !/^Section\s*\d+$/i.test(rawTitle);
        const hasDetails = details.length > 0;
        const hasGroups = groups.some((g) => g.items.length > 0 || (g.name && g.name.trim().length > 0));
        const shouldKeep = hasDetails || hasGroups || hasCustomTitle || (idx >= 3 && rawTitle.length > 0);

        return shouldKeep ? { title, details, groups } : null;
      })
      .filter(Boolean);

    try {
      setIsLoading(true);
      await api.post("/api/events", {
        date: targetDate,
        note: cleanedList,
      });

      setNotes((prev) => ({
        ...prev,
        [targetDate]: targetList,
      }));

      setCopyToDateModal((prev) => ({ ...prev, isOpen: false }));
      setSelectedDate(targetDate);
      showToast(`Section copied to ${getSelectedBsDateString(targetDate)} successfully!`, "success");

      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      console.error("Copy error:", err);
      showToast("Failed to copy section to target date. Please try again.", "warning");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setIsLoading(true);
    try {
      const rawList = getEventList(selectedDate);
      const cleanedList = rawList
        .map((item, idx) => {
          const defaultTitle = idx < 3 ? (globalSectionNames[idx] || `Section ${idx + 1}`) : `Section ${idx + 1}`;
          const rawTitle = typeof item.title === "string" ? item.title.trim() : "";
          const title = rawTitle || defaultTitle;
          const details = typeof item.details === "string" ? item.details.trim() : "";
          const groups = Array.isArray(item.groups)
            ? item.groups
                .map((g) => ({
                  name: g.name?.trim() || "Group",
                  items: Array.isArray(g.items)
                    ? g.items.map((it) => (typeof it === "string" ? it.trim() : "")).filter(Boolean)
                    : [],
                }))
                .filter((g) => (g.name && g.name.trim().length > 0) || g.items.length > 0)
            : [];
          const hasCustomTitle = rawTitle.length > 0 && rawTitle !== defaultTitle && !/^Section\s*\d+$/i.test(rawTitle);
          const hasDetails = details.length > 0;
          const hasGroups = groups.some((g) => g.items.length > 0 || (g.name && g.name.trim().length > 0));
          const shouldKeep = hasDetails || hasGroups || hasCustomTitle || (idx >= 3 && rawTitle.length > 0);

          return shouldKeep ? { title, details, groups } : null;
        })
        .filter(Boolean);

      await api.post("/api/events", {
        date: selectedDate,
        note: cleanedList,
      });
      showToast("Events saved successfully!", "success");
      setFullscreenEventIndex(null);
    } catch (err) {
      console.error("Save error:", err);
      showToast("Unauthorized or failed to save. Please log in again.", "warning");
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
      showToast("All events deleted for this date.", "info");
    } catch (err) {
      console.error("Error deleting:", err);
      showToast(err.response?.data?.error || "Failed to delete.", "warning");
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

  // Mini-Calendar calculation for "Copy to Date" Dialog
  const miniModalFirstDay = useMemo(() => {
    return new NepaliDate(copyToDateModal.targetYear, copyToDateModal.targetMonth, 1).getDay();
  }, [copyToDateModal.targetYear, copyToDateModal.targetMonth]);

  const miniModalDaysInMonth = useMemo(() => {
    return new NepaliDate(copyToDateModal.targetYear, copyToDateModal.targetMonth + 1, 0).getDate();
  }, [copyToDateModal.targetYear, copyToDateModal.targetMonth]);

  const miniModalMonthName = useMemo(() => {
    return new NepaliDate(copyToDateModal.targetYear, copyToDateModal.targetMonth, 1).format("MMMM", "np");
  }, [copyToDateModal.targetYear, copyToDateModal.targetMonth]);

  const miniModalYearNp = useMemo(() => {
    return new NepaliDate(copyToDateModal.targetYear, copyToDateModal.targetMonth, 1).format("YYYY", "np");
  }, [copyToDateModal.targetYear, copyToDateModal.targetMonth]);

  const handleMiniPrev = () => {
    setCopyToDateModal((prev) => ({
      ...prev,
      targetMonth: prev.targetMonth === 0 ? 11 : prev.targetMonth - 1,
      targetYear: prev.targetMonth === 0 ? prev.targetYear - 1 : prev.targetYear,
    }));
  };

  const handleMiniNext = () => {
    setCopyToDateModal((prev) => ({
      ...prev,
      targetMonth: prev.targetMonth === 11 ? 0 : prev.targetMonth + 1,
      targetYear: prev.targetMonth === 11 ? prev.targetYear + 1 : prev.targetYear,
    }));
  };

  return (
    <div className="relative w-full">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-[120] px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md transition-all ${
              feedback.type === "warning"
                ? "bg-amber-900/95 text-amber-100 border-amber-600"
                : feedback.type === "info"
                ? "bg-blue-900/95 text-blue-100 border-blue-600"
                : "bg-gray-900/95 text-white border-gray-700 dark:bg-red-950/95 dark:border-red-600"
            }`}
          >
            {feedback.type === "warning" ? (
              <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
            ) : feedback.type === "info" ? (
              <Info size={15} className="text-blue-400 flex-shrink-0" />
            ) : (
              <Check size={15} className="text-emerald-400 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="flex-1 flex flex-col space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-red-500" />
                    Event Sections
                  </span>
                  {copiedSection && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                      <Copy size={10} /> Copied: {copiedSection.title}
                    </span>
                  )}
                </div>

                {selectedEvents.map((evt, index) => {
                  const isGlobalSection = index < 3;
                  const currentTitle = typeof evt.title === "string"
                    ? evt.title
                    : (isGlobalSection ? (globalSectionNames[index] || `Section ${index + 1}`) : `Section ${index + 1}`);

                  const isEmpty = isSectionEmpty(evt, index);

                  return (
                    <div
                      key={`event-section-${index}`}
                      className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm focus-within:border-red-400 dark:focus-within:border-red-500 transition-all group"
                    >
                      {/* Event Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-5 h-5 flex-shrink-0 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={currentTitle}
                              onChange={(e) => handleSectionTitleChange(index, e.target.value)}
                              placeholder={`Section ${index + 1} Title`}
                              className="w-full text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 hover:border-red-400 focus:border-red-500 focus:outline-none py-0.5 pr-5 transition-colors placeholder:text-gray-400"
                              title="Click to edit section title"
                            />
                            <Edit3 size={11} className="absolute right-0.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopySection(index, evt)}
                            disabled={isEmpty}
                            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                              isEmpty
                                ? "text-gray-300 dark:text-gray-600 hover:text-gray-500 cursor-not-allowed opacity-40"
                                : "text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700"
                            }`}
                            title={isEmpty ? "Section is empty (add notes or rosters first)" : "Copy this section's content"}
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCopyToDateModal(index, evt)}
                            disabled={isEmpty}
                            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                              isEmpty
                                ? "text-gray-300 dark:text-gray-600 hover:text-gray-500 cursor-not-allowed opacity-40"
                                : "text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700"
                            }`}
                            title={isEmpty ? "Section is empty (add notes or rosters first)" : "Copy this section directly to another date"}
                          >
                            <CalendarPlus size={13} />
                          </button>
                          {copiedSection && (
                            <button
                              type="button"
                              onClick={() => handlePasteSection(index)}
                              className="p-1.5 sm:p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors"
                              title={`Paste copied section ("${copiedSection.title}") into this slot`}
                            >
                              <ClipboardPaste size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setFullscreenEventIndex(index)}
                            className="p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Open Fullscreen Expanded View"
                          >
                            <Maximize2 size={14} />
                          </button>
                          <button
                            type="button"
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

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopySection(index, evt)}
                            disabled={isEmpty}
                            className={`text-[10px] flex items-center gap-1 transition-colors ${
                              isEmpty
                                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                : "text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            }`}
                            title={isEmpty ? "Section is empty" : "Copy section"}
                          >
                            <Copy size={10} /> Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCopyToDateModal(index, evt)}
                            disabled={isEmpty}
                            className={`text-[10px] flex items-center gap-1 transition-colors ${
                              isEmpty
                                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                : "text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            }`}
                            title={isEmpty ? "Section is empty" : "Copy to another date"}
                          >
                            <CalendarPlus size={10} /> Copy to Date
                          </button>
                        </div>
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

                {/* + Add Another Event Section Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleAddEventSlot}
                    className="w-full py-2.5 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 rounded-2xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Plus size={15} />
                    Add Another Event Section for this Date
                  </button>

                  {copiedSection && (
                    <button
                      onClick={() => handlePasteSection(null)}
                      className="w-full py-2.5 px-4 border-2 border-dashed border-emerald-300 dark:border-emerald-800/70 hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 transition-all flex items-center justify-center gap-2 active:scale-98 shadow-xs"
                      title="Paste the copied section as a new event slot for this date"
                    >
                      <ClipboardPaste size={14} />
                      Paste Copied Section as New Slot ("{copiedSection.title}")
                    </button>
                  )}
                </div>
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

      {/* "Copy Section to Date" Dialog */}
      <AnimatePresence>
        {copyToDateModal.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 overscroll-contain">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCopyToDateModal((prev) => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 z-10 max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/60 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                    <CalendarPlus size={16} />
                  </div>
                  <div>
                    <h4 className="font-serif text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                      Copy Section to Another Date
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Select target date to duplicate this section with all rosters & notes
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCopyToDateModal((prev) => ({ ...prev, isOpen: false }))}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                {/* Source Section Preview Card */}
                <div className="p-3.5 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block mb-1">
                    Section Being Copied (From: {getSelectedBsDateString(copyToDateModal.sourceDate)})
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {copyToDateModal.sourceTitle || "Section"}
                  </p>
                  {copyToDateModal.sourceDetails && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 italic">
                      "{copyToDateModal.sourceDetails}"
                    </p>
                  )}
                  {Array.isArray(copyToDateModal.sourceGroups) && copyToDateModal.sourceGroups.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      {copyToDateModal.sourceGroups.map((g, idx) => (
                        <span
                          key={`src-grp-${idx}`}
                          className="text-[10px] bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full border border-red-200/60 dark:border-red-900/40 font-medium"
                        >
                          {g.name || "Group"} ({g.items?.length || 0})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Target Date Picker (Interactive Mini Calendar) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <CalendarIcon size={14} className="text-red-500" /> Select Target Date
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {miniModalMonthName} {miniModalYearNp}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleMiniPrev}
                          className="p-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={handleMiniNext}
                          className="p-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Days of week */}
                  <div className="grid grid-cols-7 text-center text-[10px] uppercase font-bold text-gray-400">
                    {days.map((d, idx) => (
                      <div key={`mini-day-${d}`} className={idx === 6 ? "text-red-500" : ""}>
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: miniModalFirstDay }).map((_, i) => (
                      <div key={`mini-empty-${i}`} />
                    ))}
                    {Array.from({ length: miniModalDaysInMonth }, (_, i) => {
                      const day = i + 1;
                      const npDate = new NepaliDate(copyToDateModal.targetYear, copyToDateModal.targetMonth, day);
                      const adObj = npDate.getAD();
                      const fullDate = `${adObj.year}-${String(adObj.month + 1).padStart(2, "0")}-${String(adObj.date).padStart(2, "0")}`;
                      const isSelected = copyToDateModal.targetDate === fullDate;
                      const isSource = copyToDateModal.sourceDate === fullDate;
                      const hasEvts = checkHasEvent(fullDate);

                      return (
                        <button
                          key={`mini-cell-${fullDate}`}
                          type="button"
                          onClick={() => setCopyToDateModal((prev) => ({ ...prev, targetDate: fullDate }))}
                          className={`p-1.5 sm:p-2 rounded-xl text-xs flex flex-col items-center justify-center transition-all relative border ${
                            isSelected
                              ? "bg-red-600 text-white border-red-600 shadow-sm"
                              : isSource
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                              : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-100 dark:border-gray-700 hover:border-red-300"
                          }`}
                        >
                          <span className="font-semibold text-xs">{npDate.format("D", "np")}</span>
                          <span className={`text-[8px] ${isSelected ? "text-red-100" : "text-gray-400"}`}>
                            {adObj.date}
                          </span>
                          {hasEvts && (
                            <div
                              className={`w-1 h-1 rounded-full absolute bottom-0.5 left-1/2 -translate-x-1/2 ${
                                isSelected ? "bg-white" : "bg-green-500"
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Placement Settings */}
                {copyToDateModal.targetDate && (
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Layers size={13} className="text-red-500" /> Placement Option on Selected Date:
                      </label>
                      <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                        {getSelectedBsDateString(copyToDateModal.targetDate)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setCopyToDateModal((prev) => ({ ...prev, placementMode: "smart" }))}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          copyToDateModal.placementMode === "smart"
                            ? "bg-red-50/80 dark:bg-red-950/40 border-red-400 text-red-800 dark:text-red-200 font-semibold shadow-2xs"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold mb-0.5">
                          <Sparkles size={12} className="text-red-500" /> Safe Auto-Place
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                          Uses slot {copyToDateModal.sourceIndex + 1} if empty; appends as new event if occupied.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCopyToDateModal((prev) => ({ ...prev, placementMode: "append" }))}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          copyToDateModal.placementMode === "append"
                            ? "bg-red-50/80 dark:bg-red-950/40 border-red-400 text-red-800 dark:text-red-200 font-semibold shadow-2xs"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold mb-0.5">
                          <Plus size={12} className="text-red-500" /> Add as New Section
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                          Guarantees zero overlap by creating a new extra event slot.
                        </p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3.5 sm:p-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/60 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setCopyToDateModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCopyToDate}
                  disabled={!copyToDateModal.targetDate || isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-red-700 transition-all shadow-md shadow-red-200 dark:shadow-none disabled:opacity-50 active:scale-98"
                >
                  <CalendarPlus size={15} />
                  {isLoading ? "Copying..." : "Copy Section to Selected Date"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Single-Card Fullscreen Modal */}
      <AnimatePresence>
        {fullscreenEventIndex !== null && selectedDate && (
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

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopySection(fullscreenEventIndex ?? 0, activeModalEvent)}
                    disabled={isSectionEmpty(activeModalEvent, fullscreenEventIndex ?? 0)}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs ${
                      isSectionEmpty(activeModalEvent, fullscreenEventIndex ?? 0)
                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        : "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                    title={isSectionEmpty(activeModalEvent, fullscreenEventIndex ?? 0) ? "Section is empty" : "Copy section to clipboard"}
                  >
                    <Copy size={15} />
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isSectionEmpty(activeModalEvent, fullscreenEventIndex ?? 0)) {
                        showToast("Section is empty. Add notes or rosters first.", "warning");
                        return;
                      }
                      setFullscreenEventIndex(null);
                      handleOpenCopyToDateModal(fullscreenEventIndex ?? 0, activeModalEvent);
                    }}
                    disabled={isSectionEmpty(activeModalEvent, fullscreenEventIndex ?? 0)}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs ${
                      isSectionEmpty(activeModalEvent, fullscreenEventIndex ?? 0)
                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        : "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                    title={isSectionEmpty(activeModalEvent, fullscreenEventIndex ?? 0) ? "Section is empty" : "Copy to another date"}
                  >
                    <CalendarPlus size={15} />
                    <span className="hidden sm:inline">Copy to Date</span>
                  </button>
                  <button
                    onClick={() => setFullscreenEventIndex(null)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 p-4 sm:p-7 flex flex-col gap-4 overflow-y-auto overscroll-contain touch-pan-y">
                {/* Event Name Input */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Edit3 size={13} className="text-red-500" />
                      Section Title
                    </span>
                  </label>
                  <input
                    type="text"
                    value={
                      typeof activeModalEvent.title === "string"
                        ? activeModalEvent.title
                        : ((fullscreenEventIndex ?? 0) < 3
                            ? (globalSectionNames[fullscreenEventIndex ?? 0] || `Section ${(fullscreenEventIndex ?? 0) + 1}`)
                            : `Section ${(fullscreenEventIndex ?? 0) + 1}`)
                    }
                    onChange={(e) =>
                      handleSectionTitleChange(fullscreenEventIndex ?? 0, e.target.value)
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
