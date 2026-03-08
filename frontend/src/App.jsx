import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ChurchLogin from "./pages/LoginPage";
import CalendarPage from "./pages/CalendarPage"; // Admin/Editable version
import ReadCalendarPage from "./pages/ReadOnlyCalendarPage"; // Public version

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b p-4 flex gap-6 justify-center text-sm font-medium text-black">
          <Link
            to="/"
            className="hover:text-indigo-800 underline decoration-transparent hover:decoration-gray-500 transition-all"
          >
            Public Calendar
          </Link>
          {/* <Link to="/admin-calendar" className="hover:text-gray-800">
            Admin View
          </Link> */}
          <Link to="/login" className="hover:text-gray-800">
            Login
          </Link>
        </nav>

        <div className="p-4 flex justify-center">
          <Routes>
            <Route path="/" element={<ReadCalendarPage />} />

            <Route path="/admin-calendar" element={<CalendarPage />} />

            <Route path="/login" element={<ChurchLogin />} />

            <Route
              path="*"
              element={<div className="p-10 text-center">Page Not Found</div>}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
