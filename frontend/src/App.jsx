import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function InteractiveCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [notes, setNotes] = useState({});

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // compute first day and days in month for the currently selected month/year
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

  const isToday = (y, mZeroBased, d) => {
    return (
      y === today.getFullYear() &&
      mZeroBased === today.getMonth() &&
      d === today.getDate()
    );
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Calendar Section (spans 2 columns on large) */}
        <div className="md:col-span-2 lg:col-span-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrev}
                aria-label="Previous month"
                className="text-2xl font-bold p-2 rounded-full hover:bg-gray-100"
              >
                ◀
              </button>

              <div className="text-left">
                <h2 className="text-2xl font-semibold">{`${monthName} ${currentYear}`}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(currentYear, currentMonth, 1).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                className="border rounded-lg p-2"
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
                className="border rounded-lg p-2"
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
              >
                {Array.from({ length: 9 }, (_, i) => {
                  const year = today.getFullYear() - 4 + i; // range: currentYear-4 .. currentYear+4
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>

              <button
                onClick={handleNext}
                aria-label="Next month"
                className="text-2xl font-bold p-2 rounded-full hover:bg-gray-100"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 text-center font-semibold text-gray-600 mb-2">
            {days.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="p-3 rounded-xl" />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }, (_, idx) => {
              const day = idx + 1;
              const fullDate = formatFullDate(currentYear, currentMonth, day);
              const hasNote = Boolean(notes[fullDate]);

              return (
                <motion.button
                  key={fullDate}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDate(fullDate)}
                  className={`relative p-3 rounded-xl cursor-pointer text-center border transition-all text-sm
                    ${
                      selectedDate === fullDate
                        ? "bg-green-600 text-white"
                        : "bg-white hover:bg-green-50"
                    }
                    ${hasNote ? "border-green-600" : "border-gray-200"}`}
                >
                  <div className="flex items-center justify-center flex-col">
                    <span
                      className={`font-medium ${
                        isToday(currentYear, currentMonth, day) && "underline"
                      }`}
                    >
                      {day}
                    </span>
                    {hasNote && (
                      <span className="text-xs mt-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        Note
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Notes / Detail Panel */}
        <aside className="bg-gray-50 rounded-xl p-4 shadow-inner">
          <h3 className="text-lg font-semibold mb-3">Notes</h3>

          {selectedDate ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Selected: {selectedDate}
              </p>
              <textarea
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={8}
                placeholder="Write a note for this day..."
                value={notes[selectedDate] || ""}
                onChange={(e) =>
                  setNotes({ ...notes, [selectedDate]: e.target.value })
                }
              />

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    // save is implicit because we already update state onChange, but provide a quick feedback pattern
                    alert("Note saved");
                  }}
                  className="px-4 py-2 rounded-xl shadow-sm hover:shadow-md"
                >
                  Save
                </button>

                <button
                  onClick={() => {
                    const copy = { ...notes };
                    delete copy[selectedDate];
                    setNotes(copy);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>

                <button
                  onClick={() => setSelectedDate(null)}
                  className="ml-auto px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 italic">
                Click a date on the calendar to add or view a note.
              </p>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Quick tips</h4>
                <ul className="text-sm list-disc list-inside text-gray-600">
                  <li>Use the month/year selectors to jump quickly.</li>
                  <li>
                    Dates with a small tag indicate there is a saved note.
                  </li>
                  <li>Today is underlined.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Simple list of upcoming notes for quick navigation */}
          <div className="mt-6">
            <h4 className="font-medium mb-2">Saved notes</h4>
            {Object.keys(notes).length === 0 ? (
              <p className="text-sm text-gray-500">No notes yet.</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-auto">
                {Object.entries(notes).map(([date, note]) => (
                  <li key={date}>
                    <button
                      onClick={() => setSelectedDate(date)}
                      className="text-left w-full"
                    >
                      <div className="text-sm font-medium">{date}</div>
                      <div className="text-xs text-gray-600 truncate">
                        {note}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
