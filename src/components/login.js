"use client";

import { useState, useCallback } from "react";
import { Eye, EyeOff, User, Lock, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [agentId, setAgentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleForgot = useCallback(() => {
    router.push("/Auth-security");
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // DUMMY API LINK - Replace with your MongoDB API endpoint later
      const API_URL = "https://api.example.com/v1/auth/login";

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          agentId: agentId.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      // ✅ AUTH PERSISTENCE
      if (data.stores_id) {
        localStorage.setItem("stores_id", data.stores_id);
      }
      localStorage.setItem("store_profile", JSON.stringify(data));

      router.push("/Dashboard");
    } catch (err) {
      setError(err.message || "Connection failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /** * min-h-[100dvh] ensures it takes full height even with mobile browser bars.
     * pb-safe adds padding for mobile home indicators (iPhone).
     */
    <div className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col items-center justify-center px-6 py-8 pb-safe">
      {/* Container restricted to mobile width but expands on desktop */}
      <div className="w-full max-w-sm flex flex-col">
        {/* LOGO SECTION - Animated fade-in */}
        <div className="flex flex-col items-center mb-8 animate-in fade-in duration-700">
          <div className="relative w-24 h-24 mb-4 drop-shadow-sm">
            <Image
              src="/Logo.png"
              alt="Company Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Sign in 
          </p>
        </div>

        {/* FORM CARD */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-100/50 p-8 border border-gray-50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* AGENT ID FIELD */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">
                User ID
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#028bcc] text-gray-400">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#028bcc] focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-800 placeholder:text-gray-400"
                  placeholder=""
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-xs font-semibold text-[#028bcc] active:scale-95 transition-transform"
                >
                  Forgot?
                </button>
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#028bcc] text-gray-400">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-14 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#028bcc] focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-800 placeholder:text-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#028bcc]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-medium p-3 rounded-xl text-center animate-shake">
                {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#028bcc] text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Verifying...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
