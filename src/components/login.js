"use client";

import { useState } from "react";
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

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    // Calling your own Next.js API proxy to avoid CORS issues
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent: agentId.trim(),
        password: password,
      }),
    });

    const data = await res.json();
    // Inside handleSubmit after 'const data = await res.json();'
    if (data.user) {
      // Save the specific userid (e.g., "Security") to localStorage
      localStorage.setItem("user_role", data.user.userid);
    }

    if (!res.ok) {
      throw new Error(data.message || "Invalid ID or Password");
    }

    // Store the token and profile for PWA persistence
    if (data.token) localStorage.setItem("auth_token", data.token);
    localStorage.setItem("user_data", JSON.stringify(data));

    // Success! Move to the Dashboard
    router.push("/Maindash");
  } catch (err) {
    setError(err.message || "Connection failed. Please check your internet.");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm flex flex-col">
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-24 h-24 mb-4">
            <Image
              src="/Logo.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Welcome Back
          </h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* USER ID FIELD */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-gray-500 ml-1">
                User ID
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  required
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  // Changed: Added text-black and bg-white to ensure visibility
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:border-[#028bcc] outline-none text-black placeholder:text-gray-300"
                  placeholder="Enter your ID"
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-gray-500 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // Changed: Added text-black and bg-white
                  className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl focus:border-[#028bcc] outline-none text-black placeholder:text-gray-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-xs text-center font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#028bcc] text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
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
