"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/header";
import AttendanceSystem from "@/components/attendance";
import ShiftMgmtTile from "@/components/shiftmgmt";
import RegisterEmpTile from "@/components/registeremp";
import ReportsTile from "@/components/reports";

export default function MainDash() {
  // Initialize as null to prevent flickering before useEffect runs
  const [userRole, setUserRole] = useState("Loading...");

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role");
    // If it's "Security", React will automatically hide the other tiles below
    if (savedRole) {
      setUserRole(savedRole);
    } else {
      setUserRole("Guest");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 px-7 pt-10 pb-20">
        <div className="mb-10 ml-1">
          <h1 className="text-3xl font-[900] text-gray-900 tracking-tight leading-none">
            Dashboard
          </h1>
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100">
            <div className="w-2 h-2 bg-[#028bcc] rounded-full animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Access Level: <span className="text-[#028bcc]">{userRole}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 w-full max-w-md mx-auto">
          {/* 1. ATTENDANCE: Always visible */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AttendanceSystem />
          </div>

          {/* 2. REGISTER: ONLY HR or Admin */}
          {["HR", "Admin"].includes(userRole) && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <RegisterEmpTile />
            </div>
          )}

          {/* 3. SHIFTS: ONLY HR, Admin, or Manager (Explicitly excludes Security) */}
          {["HR", "Admin", "Manager"].includes(userRole) && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <ShiftMgmtTile />
            </div>
          )}

          {/* 4. REPORTS: ONLY Admin, CEO, or Plant Manager */}
          {["Admin", "CEO", "Plant Manager"].includes(userRole) && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
              <ReportsTile />
            </div>
          )}
        </div>
      </main>

      <footer className="p-6 text-center"></footer>
    </div>
  );
}
