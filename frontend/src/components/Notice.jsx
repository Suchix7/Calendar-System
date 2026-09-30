import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Save,
  Loader2,
  Edit3,
  ExternalLink,
  Maximize2,
  X,
  BellRing,
} from "lucide-react";
import api from "../api/axios";
import FormattedText from "./FormattedText";


export default function Notice({ isAdmin = false }) {
  const [content, setContent] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/api/settings/church_notice");
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
        console.error("Failed to load church notice:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotice();
  }, []);

  // Lock background scrolling on mobile & desktop when popup is open
  useEffect(() => {
    if (isPopupOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPopupOpen]);

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
      await api.post("/api/settings/church_notice", { value: draftContent });
      setContent(draftContent);
      setIsEditing(false);
      alert("Notice saved successfully!");
    } catch (err) {
      console.error("Failed to save notice:", err);
      alert("Failed to save notice. Please ensure you are logged in.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        onClick={() => !isEditing && content.trim() && setIsPopupOpen(true)}
        className={`w-full h-full flex flex-col rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50/60 via-white to-sky-50/40 dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-900 border border-blue-200/70 dark:border-blue-900/30 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.08)] dark:shadow-none p-3 sm:p-5 md:p-6 transition-all ${
          !isEditing && content.trim() ? "cursor-pointer hover:border-blue-300 dark:hover:border-blue-700/60 hover:shadow-md" : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 pb-2 sm:pb-3 border-b border-blue-200/50 dark:border-gray-800">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm flex-shrink-0">
              <Megaphone className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-base md:text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 flex flex-wrap items-baseline gap-1 truncate">
                Notice
                <span className="text-[9px] sm:text-[11px] font-sans font-normal text-gray-400 dark:text-gray-500">
                  (सूचना)
                </span>
              </h3>
              <p className="hidden md:block text-[11px] text-gray-500 dark:text-gray-400 truncate">
                Important announcements and updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {content.trim() && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPopupOpen(true);
                }}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors shadow-sm active:scale-95"
                title="Open in Popup Modal"
              >
                <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden lg:inline">Popup</span>
              </button>
            )}

            {isAdmin && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit();
                }}
                className="px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors shadow-sm active:scale-95"
              >
                <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">{content.trim() ? "Edit" : "+ Add"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-center pt-2 sm:pt-3.5">
          {isLoading ? (
            <div className="py-4 flex items-center justify-center text-gray-400">
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-1.5 text-blue-500" />
              <span className="text-[11px] sm:text-xs">Loading...</span>
            </div>
          ) : isAdmin && isEditing ? (
            /* Admin Notepad Editor */
            <div className="space-y-2.5" onClick={(e) => e.stopPropagation()}>
              <textarea
                rows={4}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Write church notices, weekly announcements, special schedules, links..."
                className="w-full p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-blue-200/80 dark:border-gray-700 bg-white dark:bg-gray-800/80 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 focus:border-blue-400 outline-none text-[11px] sm:text-xs md:text-sm text-gray-800 dark:text-gray-100 placeholder:italic placeholder-gray-400 leading-relaxed resize-y transition-all shadow-inner"
                autoFocus
              />
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                <button
                  onClick={handleCancel}
                  className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg sm:rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 dark:shadow-none disabled:opacity-50 active:scale-98"
                >
                  <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{isSaving ? "Saving..." : "Save"}</span>
                </button>
              </div>
            </div>
          ) : content.trim() ? (
            /* Display View - Clean card that expands on click */
            <div className="h-full flex items-center bg-white/80 dark:bg-gray-800/60 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-blue-100 dark:border-gray-800/80 shadow-sm transition-all">
              <FormattedText
                text={content}
                className="text-[11px] sm:text-xs md:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-sans line-clamp-3 sm:line-clamp-4"
              />
            </div>
          ) : (
            /* Clean Empty State */
            <div className="py-2.5 sm:py-4 px-1 text-center text-gray-400 dark:text-gray-500 italic text-[11px] sm:text-xs flex items-center justify-center">
              Nothing to display
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Popup Modal for Notice */}
      <AnimatePresence>
        {isPopupOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6 md:p-8 overscroll-contain">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPopupOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md touch-none"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl h-[88dvh] max-h-[88dvh] sm:h-[80vh] sm:max-h-[750px] bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 z-10 overscroll-contain"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-blue-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-50/80 to-sky-50/50 dark:from-gray-800/80 dark:to-gray-800/40 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                    <Megaphone size={22} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
                      Church Notice
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      सूचना तथा जानकारी — Announcements & Updates
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
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors shadow-sm"
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
              <div className="flex-1 p-5 sm:p-8 overflow-y-auto space-y-4 overscroll-contain touch-pan-y">
                <div className="bg-blue-50/40 dark:bg-gray-800/40 rounded-2xl p-5 sm:p-6 border border-blue-100/80 dark:border-gray-800 shadow-inner">
                  <FormattedText
                    text={content}
                    className="text-sm sm:text-base text-gray-800 dark:text-gray-100 leading-relaxed font-sans"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/60 flex-shrink-0">
                <p className="text-[11px] text-gray-400 italic">
                  Prakash Church Community & Notices
                </p>
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-200 dark:shadow-none active:scale-95"
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
