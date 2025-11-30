import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function InteractiveCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [notes, setNotes] = useState({});

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDay = useMemo(
    () => new Date(currentYear, currentMonth, 1).getDay(),
    [currentMonth, currentYear]
  );
  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0).getDate(),
    [currentMonth, currentYear]
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

  const formatFullDate = (y, mZeroBased, d) =>
    `${y}-${String(mZeroBased + 1).padStart(2, "0")}-${String(d).padStart(
      2,
      "0"
    )}`;

  const monthName = useMemo(
    () =>
      new Date(currentYear, currentMonth).toLocaleString("default", {
        month: "long",
      }),
    [currentMonth, currentYear]
  );

  const isToday = (y, mZeroBased, d) =>
    y === today.getFullYear() &&
    mZeroBased === today.getMonth() &&
    d === today.getDate();

  return (
    <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Main container */}
      <div
        className="
        w-full max-w-6xl bg-white rounded-2xl shadow-xl p-4 sm:p-6 
        grid grid-cols-1 lg:grid-cols-3 gap-6
      "
      >
        {/* Calendar Section */}
        <div className="lg:col-span-2 w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrev}
                className="text-xl p-2 rounded-full hover:bg-gray-100"
              >
                ◀
              </button>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">
                  {monthName} {currentYear}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {new Date(currentYear, currentMonth, 1).toDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                className="border rounded-lg p-2 text-sm"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>

              <select
                className="border rounded-lg p-2 text-sm"
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
              >
                {Array.from({ length: 9 }, (_, i) => {
                  const year = today.getFullYear() - 4 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>

              <button
                onClick={handleNext}
                className="text-xl p-2 rounded-full hover:bg-gray-100"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 text-center font-semibold text-gray-600 mb-2 text-sm sm:text-base">
            {days.map((d) => (
              <div key={d} className="py-1 sm:py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="p-3" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const fullDate = formatFullDate(currentYear, currentMonth, day);
              const hasNote = Boolean(notes[fullDate]);

              return (
                <motion.button
                  key={fullDate}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedDate(fullDate)}
                  className={`
                    p-2 sm:p-3 rounded-xl text-sm border text-center transition 
                    ${
                      selectedDate === fullDate
                        ? "bg-green-600 text-white"
                        : "bg-white hover:bg-green-50"
                    }
                    ${hasNote ? "border-green-600" : "border-gray-200"}
                  `}
                >
                  <span
                    className={`font-medium ${
                      isToday(currentYear, currentMonth, day) ? "underline" : ""
                    }`}
                  >
                    {day}
                  </span>
                  {hasNote && (
                    <div className="text-xs mt-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-800">
                      Note
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Notes Panel */}
        <aside className="bg-gray-50 rounded-xl p-4 shadow-inner">
          <h3 className="text-lg font-semibold mb-3">Notes</h3>

          {selectedDate ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Selected: {selectedDate}
              </p>
              <textarea
                className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-green-500"
                rows={6}
                placeholder="Write a note..."
                value={notes[selectedDate] || ""}
                onChange={(e) =>
                  setNotes({ ...notes, [selectedDate]: e.target.value })
                }
              />

              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => alert("Note saved")}
                  className="px-4 py-2 rounded-xl bg-white shadow"
                >
                  Save
                </button>

                <button
                  onClick={() => {
                    const updated = { ...notes };
                    delete updated[selectedDate];
                    setNotes(updated);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-700"
                >
                  Delete
                </button>

                <button
                  onClick={() => setSelectedDate(null)}
                  className="ml-auto px-4 py-2 rounded-xl bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">
              Tap any date to add or view notes.
            </p>
          )}

          <div className="mt-6">
            <h4 className="font-medium mb-2">Saved notes</h4>
            {Object.keys(notes).length === 0 ? (
              <p className="text-sm text-gray-500">No notes yet.</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-auto text-sm">
                {Object.entries(notes).map(([date, note]) => (
                  <li key={date}>
                    <button
                      onClick={() => setSelectedDate(date)}
                      className="text-left w-full hover:underline"
                    >
                      <div className="font-medium">{date}</div>
                      <div className="text-gray-600 truncate">{note}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
