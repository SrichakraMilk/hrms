"use client";
import { useState, useEffect } from "react";
import { User, Mail, MapPin, Shield, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Instant UI: Load from cache so data is visible immediately
    const cachedUser = localStorage.getItem("user_details");
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
      setLoading(false);
    }

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("auth_token");

        if (!token) {
          router.push("/");
          return;
        }

        // 2. Production API: Fetch fresh data using the Bearer token
        const res = await fetch(
          "https://production.srichakramilk.com/api/auth/me",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`, // Verified format
              "Content-Type": "application/json",
            },
          },
        );

        if (res.ok) {
          const data = await res.json();
          const userData = data.user || data; // Handle nested structure

          setUser(userData);
          // Sync storage for attendance.js
          localStorage.setItem("user_details", JSON.stringify(userData));
        } else if (res.status === 401) {
          console.error("Token invalid. Session likely expired.");
        }
      } catch (error) {
        console.error("Network Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear(); // Clear everything on manual logout
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* HEADER */}
      <div className="w-full bg-[#028bcc] pt-16 pb-24 px-6 flex flex-col items-center rounded-b-[3rem] shadow-lg">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner mb-4 border-4 border-white/20">
          <User size={48} className="text-[#028bcc]" />
        </div>

        {!loading && (
          <>
            <h2 className="text-2xl font-black text-white capitalize">
              {user?.fname} {user?.lname}
            </h2>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
              {user?.role?.name || "HR Manager"}
            </p>
          </>
        )}
      </div>

      {/* INFO CARDS */}
      <div className="w-full max-w-sm -mt-12 px-6 space-y-4 mb-10">
        <div className="bg-white p-6 rounded-[2rem] shadow-xl space-y-6 border border-gray-100">
          <InfoRow
            label="Email Address"
            value={user?.email}
            icon={<Mail size={20} />}
          />
          <InfoRow
            label="User ID"
            value={user?.userid}
            icon={<Shield size={20} />}
          />
          <InfoRow
            label="Plant / Location"
            value={user?.plant?.name || "Antharam"}
            icon={<MapPin size={20} />}
          />
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-5 bg-red-50 text-red-500 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3"
        >
          <LogOut size={20} /> Logout Account
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-3 bg-blue-50 text-[#028bcc] rounded-2xl">{icon}</div>
      <div className="flex-1 text-sm font-bold text-gray-800">
        <p className="text-[10px] font-black text-gray-400 uppercase leading-none">
          {label}
        </p>
        <p className="mt-1">{value || "Checking..."}</p>
      </div>
    </div>
  );
}
