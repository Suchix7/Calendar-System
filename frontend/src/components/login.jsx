import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, Church, Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ChurchLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 2. Use the variable here instead of the hardcoded localhost string
      const { data } = await axios.post(
        `${API_BASE_URL.replace(/\/$/, "")}/api/auth/login`,
        formData,
      );

      // --- THE FIX IS HERE ---
      localStorage.setItem("userInfo", JSON.stringify(data));
      localStorage.setItem("token", data.token);
      localStorage.setItem("isLoggedIn", "true");

      console.log("Login successful");
      navigate("/calendar");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-black flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 transition-colors relative overflow-hidden">
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center relative z-10">
        <div className="w-full">
          <div className="flex flex-col items-center mb-8 sm:mb-10 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-sm mb-4 transition-colors">
              <Church className="text-gray-800 dark:text-gray-200 w-8 h-8" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Prakash Church
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium tracking-wider uppercase">
              Admin Portal
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-gray-800 p-8 sm:p-10 transition-colors">
            {/* Error Message Alert */}
            {error && (
              <div className="mb-6 p-3 bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-300 text-sm rounded-xl text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-gray-500 dark:text-gray-400 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-red-600 dark:group-focus-within:text-red-400 transition-colors" />
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-red-500/20 dark:focus:border-red-500/30 rounded-2xl outline-none focus:bg-white dark:focus:bg-gray-800 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                    placeholder="name@email.com"
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-gray-500 dark:text-gray-400 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-red-600 dark:group-focus-within:text-red-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-red-500/20 dark:focus:border-red-500/30 rounded-2xl outline-none focus:bg-white dark:focus:bg-gray-800 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                    placeholder="••••••••"
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-600/30 transition-all active:scale-[0.98] mt-6 tracking-wide flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Accessing...
                  </>
                ) : (
                  "Secure Login"
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center relative z-10">
            <p className="text-gray-400 dark:text-gray-600 text-[10px] uppercase tracking-[0.3em] font-bold transition-colors">
              Prakash Community System © 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChurchLogin;
