import React from "react";
import Calendar from "../components/calender";
import PrayerRequests from "../components/PrayerRequests";
import Notice from "../components/Notice";

const CalendarPage = () => {
  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-black py-6 sm:py-12 px-4 sm:px-6 text-gray-800 dark:text-gray-200 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-10 text-center border-b border-gray-100 dark:border-gray-900 pb-6 sm:pb-8">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-red-500 font-semibold mb-2 sm:mb-3 block">
            Community & Worship
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 dark:text-gray-100 tracking-tight">
            Church Calendar & Admin
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 sm:mt-3 max-w-lg mx-auto font-light italic leading-relaxed">
            Manage church services, community events, notices, and prayer requests.
          </p>
        </div>

        {/* Notice and Prayer Requests Side-by-Side Section */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-6 mb-6 sm:mb-8 items-stretch">
          <Notice isAdmin={true} />
          <PrayerRequests isAdmin={true} />
        </div>

        {/* Calendar Component Wrapper */}
        <div className="w-full">
          <Calendar />
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
