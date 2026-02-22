import React from "react";
import Calendar from "../components/calender"; // Ensure capitalization matches your filename

const CalendarPage = () => {
  return (
    <div className="min-h-screen bg-[#FDFCFB] py-16 px-6 text-stone-800">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center border-b border-stone-100 pb-10">
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 font-semibold mb-3 block">
            Community & Worship
          </span>
          <h1 className="text-4xl font-serif font-medium text-stone-900 tracking-tight">
            Church Calendar
          </h1>
          <p className="text-stone-500 mt-3 max-w-lg mx-auto font-light italic leading-relaxed">
            Join us in fellowship. Keep track of our weekly services, choir
            rehearsals, and community gatherings.
          </p>
        </div>

        {/* Calendar Component Wrapper */}
        <div className="flex justify-center">
          <div className="w-full bg-white rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] border border-stone-100 p-2">
            <Calendar />
          </div>
        </div>

        {/* Footer Note */}
        {/* <div className="mt-12 text-center">
          <p className="text-stone-400 text-sm font-light">
            Questions about an event?{" "}
            <a
              href="#"
              className="text-stone-600 underline underline-offset-4 decoration-stone-200 hover:text-stone-900 transition-colors"
            >
              Contact the Church Office
            </a>
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default CalendarPage;
