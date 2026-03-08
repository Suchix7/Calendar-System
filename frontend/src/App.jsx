import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import ChurchLogin from "./pages/LoginPage";
import CalendarPage from "./pages/CalendarPage";
import ReadCalendarPage from "./pages/ReadOnlyCalendarPage";
import ProtectedRoute from "../route/ProtectedRoute";

// We create a separate Navigation component so we can use the useNavigate hook inside it
function Navigation() {
  const navigate = useNavigate();
  // We check localStorage here so it refreshes when the component re-renders
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login"); // This will now work
  };

  return (
    <nav className="bg-white border-b p-4 flex gap-4 justify-center items-center text-sm font-medium text-indigo-600">
      <Link to="/" className="hover:text-indigo-800">
        Public View
      </Link>

      {isLoggedIn ? (
        <>
          <Link to="/calendar" className="hover:text-indigo-800">
            Admin Calendar
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold"
          >
            Logout
          </button>
        </>
      ) : (
        <Link to="/login" className="hover:text-indigo-800">
          Login
        </Link>
      )}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navigation />

        <Routes>
          <Route path="/login" element={<ChurchLogin />} />

          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<ReadCalendarPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
