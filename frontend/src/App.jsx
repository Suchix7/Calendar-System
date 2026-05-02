import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import ChurchLogin from "./pages/LoginPage";
import CalendarPage from "./pages/CalendarPage";
import ReadCalendarPage from "./pages/ReadOnlyCalendarPage";
import ProtectedRoute from "../route/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { Calendar as CalendarIcon, Shield, LogIn, LogOut } from "lucide-react";
import InstallPrompt from "./components/InstallPrompt";

// Responsive Navigation component
function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  // Safely check localStorage for strict Safari privacy modes
  let isLoggedIn = false;
  try {
    isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  } catch (e) {
    console.warn("LocalStorage access blocked by Safari.");
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem("isLoggedIn");
    } catch(e) {}
    navigate("/login");
  };

  return (
    <>
      {/* Desktop Navigation (Top-bar, hidden on mobile) */}
      <nav className="hidden sm:flex bg-white border-b px-8 py-4 justify-between items-center text-sm font-medium text-gray-800 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-red-600" size={20} />
          <span className="font-serif font-bold text-lg tracking-tight">Church Calendar</span>
        </div>
        <div className="flex gap-6 items-center">
          <Link to="/" className="text-gray-600 hover:text-red-600 transition-colors flex items-center gap-2">
            Public View
          </Link>
          
          {isLoggedIn ? (
            <>
              <Link to="/calendar" className="text-gray-600 hover:text-red-600 transition-colors flex items-center gap-2">
                 Admin Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold shadow-md shadow-red-200">
              Admin Login
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Navigation (Bottom Tab Bar, hidden on desktop) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.05)] z-50 pb-safe">
        <div className="flex justify-around items-center p-3">
          <Link to="/" className={`flex flex-col items-center gap-1 transition-colors flex-1 ${currentPath === '/' ? 'text-red-600' : 'text-gray-500 hover:text-red-600 active:text-red-600'}`}>
            <CalendarIcon size={22} className={currentPath === '/' ? 'fill-red-100' : ''} />
            <span className={`text-[10px] tracking-wide ${currentPath === '/' ? 'font-bold' : 'font-medium'}`}>Public</span>
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/calendar" className={`flex flex-col items-center gap-1 transition-colors flex-1 ${currentPath === '/calendar' ? 'text-red-600' : 'text-gray-500 hover:text-red-600 active:text-red-600'}`}>
                <Shield size={22} className={currentPath === '/calendar' ? 'fill-red-100' : ''} />
                <span className={`text-[10px] tracking-wide ${currentPath === '/calendar' ? 'font-bold' : 'font-medium'}`}>Admin</span>
              </Link>
              <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-600 active:text-red-600 transition-colors flex-1">
                <LogOut size={22} />
                <span className="text-[10px] font-medium tracking-wide">Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className={`flex flex-col items-center gap-1 transition-colors flex-1 ${currentPath === '/login' ? 'text-red-600' : 'text-gray-500 hover:text-red-600 active:text-red-600'}`}>
              <LogIn size={22} className={currentPath === '/login' ? 'fill-red-100' : ''} />
              <span className={`text-[10px] tracking-wide ${currentPath === '/login' ? 'font-bold' : 'font-medium'}`}>Login</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen pb-20 sm:pb-0">
        <InstallPrompt />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
