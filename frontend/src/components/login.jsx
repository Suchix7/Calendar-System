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
        `${API_BASE_URL}/api/auth/login`,
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
    <div className="min-h-screen w-full bg-stone-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-stone-800">
        <div className="w-full">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center border border-stone-200 shadow-sm mb-5">
              <Church className="text-stone-600 w-7 h-7" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-serif font-medium tracking-tight text-stone-900">
              Prakash Church
            </h1>
            <p className="text-stone-500 text-sm mt-2 font-light italic">
              "Walk in the light"
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-stone-100 p-8 sm:p-10">
            {/* Error Message Alert */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[12px] uppercase tracking-widest font-semibold text-stone-500 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-stone-800 transition-colors" />
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-3 bg-stone-50/50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-stone-400 transition-all text-stone-800 placeholder:text-stone-300"
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
                <label className="text-[12px] uppercase tracking-widest font-semibold text-stone-500 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-stone-800 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-11 pr-12 py-3 bg-stone-50/50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-stone-400 transition-all text-stone-800 placeholder:text-stone-300"
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-stone-800 hover:bg-stone-900 text-stone-50 font-medium py-3.5 rounded-xl shadow-sm transition-all active:scale-[0.98] mt-4 tracking-wide flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          <div className="mt-10 text-center">
            <p className="text-stone-400 text-[11px] uppercase tracking-[0.2em] font-medium">
              Est. 2026 • Prakash Church
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChurchLogin;
