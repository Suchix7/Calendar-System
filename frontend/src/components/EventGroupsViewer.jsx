import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronDown, ChevronRight } from "lucide-react";
import FormattedText from "./FormattedText";

export default function EventGroupsViewer({ groups = [], defaultExpanded = false }) {
  const [expandedMap, setExpandedMap] = useState({});

  if (!Array.isArray(groups) || groups.length === 0) return null;

  // Filter out completely empty groups
  const validGroups = groups.filter(
    (g) => g && (g.name?.trim() || (Array.isArray(g.items) && g.items.length > 0))
  );

  if (validGroups.length === 0) return null;

  const toggleGroup = (index, e) => {
    e?.stopPropagation();
    setExpandedMap((prev) => ({
      ...prev,
      [index]: prev[index] !== undefined ? !prev[index] : !defaultExpanded,
    }));
  };

  return (
    <div className="mt-3 space-y-2.5">
      {validGroups.map((group, gIdx) => {
        const isExpanded = expandedMap[gIdx] !== undefined ? expandedMap[gIdx] : defaultExpanded;
        const items = Array.isArray(group.items) ? group.items.filter((it) => typeof it === "string" && it.trim().length > 0) : [];
        const groupTitle = group.name?.trim() || `Group ${gIdx + 1}`;

        return (
          <div
            key={`group-view-${gIdx}`}
            className="rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-gray-50/70 dark:bg-gray-800/40 overflow-hidden transition-all shadow-xs"
          >
            {/* Collapsible Group Header Bar */}
            <button
              type="button"
              onClick={(e) => toggleGroup(gIdx, e)}
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center justify-between gap-2 text-left hover:bg-gray-100/70 dark:hover:bg-gray-700/40 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                  <Users size={13} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 break-words flex-1">
                  <FormattedText text={groupTitle} />
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-xs flex-shrink-0">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
                <span className="text-[10px] hidden sm:inline text-gray-400">
                  {isExpanded ? "Hide" : "Show"}
                </span>
                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </div>
            </button>

            {/* Collapsible Accordion Body */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-2.5 sm:p-3 pt-1.5 border-t border-gray-100 dark:border-gray-700/60 bg-white/60 dark:bg-gray-900/40">
                    {items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {items.map((name, nIdx) => (
                          <div
                            key={`item-${gIdx}-${nIdx}`}
                            className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 text-xs text-gray-700 dark:text-gray-300 shadow-2xs break-words"
                          >
                            <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {nIdx + 1}
                            </div>
                            <span className="flex-1 font-medium break-words leading-relaxed">
                              <FormattedText text={name} />
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic py-1 px-2">
                        No items or names listed in this section yet.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
