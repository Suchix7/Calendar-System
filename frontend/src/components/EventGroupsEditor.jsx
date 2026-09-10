import React, { useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
  ListPlus,
  Edit2,
  Check,
} from "lucide-react";

export default function EventGroupsEditor({ groups = [], onChange }) {
  const [newGroupName, setNewGroupName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [activeNewItemInput, setActiveNewItemInput] = useState({});
  const [bulkInputMap, setBulkInputMap] = useState({});
  const [showBulkMap, setShowBulkMap] = useState({});
  const [openGroups, setOpenGroups] = useState({});

  const safeGroups = Array.isArray(groups) ? groups : [];

  const handleAddGroup = () => {
    const title = newGroupName.trim() || `Group ${safeGroups.length + 1}`;
    const updated = [...safeGroups, { name: title, items: [] }];
    onChange(updated);
    setNewGroupName("");
    setIsAddingGroup(false);
    setOpenGroups((prev) => ({ ...prev, [safeGroups.length]: true }));
  };

  const handleUpdateGroupName = (index, name) => {
    const updated = [...safeGroups];
    updated[index] = { ...updated[index], name };
    onChange(updated);
  };

  const handleDeleteGroup = (index) => {
    const updated = safeGroups.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleAddItem = (groupIndex) => {
    const text = (activeNewItemInput[groupIndex] || "").trim();
    if (!text) return;
    const updated = [...safeGroups];
    const items = Array.isArray(updated[groupIndex]?.items) ? [...updated[groupIndex].items] : [];
    items.push(text);
    updated[groupIndex] = { ...updated[groupIndex], items };
    onChange(updated);
    setActiveNewItemInput((prev) => ({ ...prev, [groupIndex]: "" }));
  };

  const handleBulkAdd = (groupIndex) => {
    const raw = (bulkInputMap[groupIndex] || "").trim();
    if (!raw) return;
    const newItems = raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (newItems.length > 0) {
      const updated = [...safeGroups];
      const items = Array.isArray(updated[groupIndex]?.items) ? [...updated[groupIndex].items] : [];
      updated[groupIndex] = { ...updated[groupIndex], items: [...items, ...newItems] };
      onChange(updated);
    }
    setBulkInputMap((prev) => ({ ...prev, [groupIndex]: "" }));
    setShowBulkMap((prev) => ({ ...prev, [groupIndex]: false }));
  };

  const handleDeleteItem = (groupIndex, itemIndex) => {
    const updated = [...safeGroups];
    const items = [...(updated[groupIndex]?.items || [])];
    items.splice(itemIndex, 1);
    updated[groupIndex] = { ...updated[groupIndex], items };
    onChange(updated);
  };

  const toggleOpen = (index) => {
    setOpenGroups((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="mt-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Users size={13} className="text-red-500" />
          Nested Groups & Rosters (e.g. Teams, Names)
        </label>
        {!isAddingGroup && (
          <button
            type="button"
            onClick={() => setIsAddingGroup(true)}
            className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Plus size={12} /> Add Group / Section
          </button>
        )}
      </div>

      {/* Quick Add Group Input */}
      {isAddingGroup && (
        <div className="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
            placeholder="Group Name (e.g. Ushering Team, Group A, Worship Team)..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-red-200 dark:border-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-red-400"
            autoFocus
          />
          <div className="flex items-center gap-1.5 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsAddingGroup(false);
                setNewGroupName("");
              }}
              className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddGroup}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors shadow-xs"
            >
              Create Group
            </button>
          </div>
        </div>
      )}

      {/* Existing Groups List */}
      {safeGroups.length > 0 ? (
        <div className="space-y-2.5">
          {safeGroups.map((grp, gIdx) => {
            const isOpen = openGroups[gIdx] ?? true;
            const items = Array.isArray(grp.items) ? grp.items : [];

            return (
              <div
                key={`group-edit-${gIdx}`}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 overflow-hidden shadow-xs"
              >
                {/* Group Top Header Bar */}
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleOpen(gIdx)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <input
                      type="text"
                      value={grp.name || ""}
                      onChange={(e) => handleUpdateGroupName(gIdx, e.target.value)}
                      placeholder={`Group ${gIdx + 1} Name`}
                      className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-100 bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-red-400 focus:outline-none px-1 py-0.5 flex-1 min-w-0 transition-colors"
                    />
                    <span className="text-[10px] bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 flex-shrink-0">
                      {items.length} {items.length === 1 ? "name" : "names"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setShowBulkMap((prev) => ({ ...prev, [gIdx]: !prev[gIdx] }))
                      }
                      className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                        showBulkMap[gIdx]
                          ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                          : "text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      title="Bulk paste multiple names at once"
                    >
                      <ListPlus size={13} />
                      <span className="text-[10px] hidden sm:inline">Bulk Paste</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(gIdx)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Delete this group"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isOpen && (
                  <div className="p-3 space-y-2.5">
                    {/* Bulk Add Textarea */}
                    {showBulkMap[gIdx] && (
                      <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-gray-900/60 border border-amber-200 dark:border-amber-900/40 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                          Paste Multiple Names (one per line or comma-separated)
                        </label>
                        <textarea
                          rows={3}
                          value={bulkInputMap[gIdx] || ""}
                          onChange={(e) =>
                            setBulkInputMap((prev) => ({ ...prev, [gIdx]: e.target.value }))
                          }
                          placeholder="John Doe&#10;Sarah Smith&#10;David Paul&#10;Esther Giri..."
                          className="w-full p-2 text-xs rounded-lg border border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none font-sans"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setShowBulkMap((prev) => ({ ...prev, [gIdx]: false }))
                            }
                            className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkAdd(gIdx)}
                            className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 shadow-xs"
                          >
                            Add All Names
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Names Grid / List */}
                    {items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {items.map((item, itIdx) => (
                          <div
                            key={`item-${gIdx}-${itIdx}`}
                            className="flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/60 text-xs text-gray-800 dark:text-gray-200 group"
                          >
                            <span className="w-4 text-[10px] font-semibold text-gray-400 flex-shrink-0">
                              {itIdx + 1}.
                            </span>
                            <span className="flex-1 truncate font-medium">{item}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(gIdx, itIdx)}
                              className="text-gray-400 hover:text-red-600 p-0.5 rounded opacity-60 group-hover:opacity-100 transition-opacity"
                              title="Remove name"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic py-1">
                        No names added yet. Type a name below or use Bulk Paste.
                      </p>
                    )}

                    {/* Single Name Add Input */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={activeNewItemInput[gIdx] || ""}
                        onChange={(e) =>
                          setActiveNewItemInput((prev) => ({
                            ...prev,
                            [gIdx]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleAddItem(gIdx)}
                        placeholder="Add a name or role (e.g. John Doe - Praise Leader)..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-900 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-red-400 placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddItem(gIdx)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 dark:bg-gray-700 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            No nested groups/rosters for this section.
          </p>
          <button
            type="button"
            onClick={() => setIsAddingGroup(true)}
            className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-semibold hover:underline inline-flex items-center gap-1"
          >
            <Plus size={12} /> Add Group (e.g. Worship Team, Duty Roster)
          </button>
        </div>
      )}
    </div>
  );
}
