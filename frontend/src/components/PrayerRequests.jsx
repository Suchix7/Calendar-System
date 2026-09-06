import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartHandshake,
  Save,
  Loader2,
  Edit3,
  ExternalLink,
  Maximize2,
  X,
  BookOpen,
} from "lucide-react";
import api from "../api/axios";

// Formatter to render clickable links in prayer requests
function FormattedPrayerText({ text, className = "" }) {
  if (!text) return null;

  const parseContent = (content) => {
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|www\.[^\s)]+)\)|(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const elements = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const matchStart = match.index;
      const matchEnd = regex.lastIndex;

      if (matchStart > lastIndex) {
        elements.push(content.substring(lastIndex, matchStart));
      }

      if (match[1] && match[2]) {
        const label = match[1];
        let url = match[2];
        if (url.startsWith("www.")) url = "https://" + url;
        elements.push(
          <a
            key={`pr-link-${matchStart}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 dark:text-red-400 font-semibold underline underline-offset-2 hover:text-red-700 dark:hover:text-red-300 break-all inline-flex items-center gap-0.5 mx-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {label}
            <ExternalLink size={12} className="inline flex-shrink-0" />
          </a>
        );
      } else if (match[3]) {
        let url = match[3];
        let displayUrl = url;
        if (url.endsWith(".") || url.endsWith(",") || url.endsWith(")")) {
          url = url.slice(0, -1);
          displayUrl = url;
        }
        const href = url.startsWith("www.") ? `https://${url}` : url;
        elements.push(
          <a
            key={`pr-raw-${matchStart}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 dark:text-red-400 font-semibold underline underline-offset-2 hover:text-red-700 dark:hover:text-red-300 break-all inline-flex items-center gap-0.5 mx-0.5"
            onClick={(e) => e.stopPropagation()}
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

  return <div className={`whitespace-pre-wrap ${className}`}>{parseContent(text)}</div>;
}

export default function PrayerRequests({ isAdmin = false }) {
  const [content, setContent] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPrayerRequests = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/api/settings/prayer_requests");
        let initialText = "";
        if (typeof res.data === "string") {
          initialText = res.data;
        } else if (res.data && typeof res.data.content === "string") {
          initialText = res.data.content;
        } else if (res.data && typeof res.data.value === "string") {
          initialText = res.data.value;
        }
        setContent(initialText);
        setDraftContent(initialText);
      } catch (err) {
        console.error("Failed to load prayer requests:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrayerRequests();
  }, []);

  const handleStartEdit = () => {
    setDraftContent(content);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftContent(content);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post("/api/settings/prayer_requests", { value: draftContent });
      setContent(draftContent);
      setIsEditing(false);
      alert("Prayer Requests saved successfully!");
    } catch (err) {
      console.error("Failed to save prayer requests:", err);
      alert("Failed to save prayer requests. Please ensure you are logged in.");
    } finally {
      setIsSaving(false);
    }
  };

  const isLongContent = content.length > 220 || content.split("\n").length > 3;

  return (
    <>
      <div
        onClick={() => !isEditing && setIsPopupOpen(true)}
        className={`w-full mb-6 sm:mb-8 rounded-3xl bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-900 border border-amber-200/70 dark:border-amber-900/30 shadow-[0_4px_20px_-4px_rgba(251,191,36,0.08)] dark:shadow-none p-4 sm:p-6 transition-all ${
          !isEditing ? "cursor-pointer hover:border-amber-300 dark:hover:border-amber-700/60 hover:shadow-md" : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-amber-200/50 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
              <HeartHandshake size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                Prayer Requests
                <span className="text-[11px] font-sans font-normal text-gray-400 dark:text-gray-500">
                  (प्रार्थनाका विषयहरू)
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Lift up one another in prayer and supplication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
            {content.trim() && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPopupOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-red-300 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
                title="Open in Popup Modal"
              >
                <Maximize2 size={13} />
                <span className="hidden sm:inline">Popup View</span>
              </button>
            )}

            {isAdmin && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit();
                }}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-red-300 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
              >
                <Edit3 size={13} /> {content.trim() ? "Edit" : "+ Add Requests"}
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-3.5">
          {isLoading ? (
            <div className="py-6 flex items-center justify-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-red-500" />
              <span className="text-xs">Loading prayer requests...</span>
            </div>
          ) : isAdmin && isEditing ? (
            /* Admin Notepad Editor */
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
              <textarea
                rows={5}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Write church prayer requests, community needs, hospital visits, mission prayer points, links..."
                className="w-full p-4 rounded-2xl border border-amber-200/80 dark:border-gray-700 bg-white dark:bg-gray-800/80 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/50 focus:border-red-400 outline-none text-xs sm:text-sm text-gray-800 dark:text-gray-100 placeholder:italic placeholder-gray-400 leading-relaxed resize-y transition-all shadow-inner"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-all shadow-md shadow-red-200 dark:shadow-none disabled:opacity-50 active:scale-98"
                >
                  <Save size={14} /> {isSaving ? "Saving..." : "Save Prayer Requests"}
                </button>
              </div>
            </div>
          ) : content.trim() ? (
            /* Display View - Clean card that expands on click */
            <div className="bg-white/80 dark:bg-gray-800/60 rounded-2xl p-4 sm:p-5 border border-amber-100 dark:border-gray-800/80 shadow-sm transition-all">
              <FormattedPrayerText
                text={content}
                className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-sans line-clamp-4"
              />
            </div>
          ) : (
            /* Clean Empty State */
            <div className="py-3 px-2 text-center text-gray-400 dark:text-gray-500 italic text-xs">
              "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God." — Philippians 4:6
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Popup Modal for Prayer Requests */}
      <AnimatePresence>
        {isPopupOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6 md:p-8">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPopupOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl h-[88vh] sm:h-[80vh] max-h-[750px] bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 z-10"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-amber-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-amber-50/80 to-orange-50/50 dark:from-gray-800/80 dark:to-gray-800/40 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                    <HeartHandshake size={22} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
                      Prayer Requests
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      प्रार्थनाका विषयहरू — Lift up one another in prayer
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsPopupOpen(false);
                        handleStartEdit();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-red-300 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                  )}
                  <button
                    onClick={() => setIsPopupOpen(false)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 p-5 sm:p-8 overflow-y-auto space-y-4">
                <div className="bg-amber-50/40 dark:bg-gray-800/40 rounded-2xl p-5 sm:p-6 border border-amber-100/80 dark:border-gray-800 shadow-inner">
                  <FormattedPrayerText
                    text={content}
                    className="text-sm sm:text-base text-gray-800 dark:text-gray-100 leading-relaxed font-sans"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/60 flex-shrink-0">
                <p className="text-[11px] text-gray-400 italic">
                  "The prayer of a righteous person is powerful and effective." — James 5:16
                </p>
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-200 dark:shadow-none active:scale-95"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
