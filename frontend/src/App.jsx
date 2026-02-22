import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ChurchLogin from "./pages/LoginPage"; // This works ONLY if LoginPage.jsx has "export default"
import CalendarPage from "./pages/CalendarPage";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Simple Navigation for development */}
        <nav className="bg-white border-b p-4 flex gap-4 justify-center text-sm font-medium text-indigo-600">
          <Link to="/login" className="hover:text-indigo-800">
            Login
          </Link>
          <Link to="/" className="hover:text-indigo-800">
            Calendar
          </Link>
        </nav>

        <Routes>
          <Route path="/login" element={<ChurchLogin />} />
          <Route path="/" element={<CalendarPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
