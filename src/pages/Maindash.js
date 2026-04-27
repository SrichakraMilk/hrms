"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/header";
import AttendanceSystem from "@/components/attendance";
import ShiftMgmtTile from "@/components/shiftmgmt";
import RegisterEmpTile from "@/components/registeremp";
import ReportsTile from "@/components/reports";

export default function MainDash() {
  // Mock role for testing; will be replaced by API/localStorage later
  const [userRole, setUserRole] = useState("Admin");

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role");
    if (savedRole) setUserRole(savedRole);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 px-7 pt-10 pb-20">
        {/* --- WELCOME & ROLE SECTION --- */}
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

        {/* --- MODULE GRID --- */}
        {/* 'grid-cols-2' ensures a perfect two-column layout on mobile */}
        <div className="grid grid-cols-2 gap-5 w-full max-w-md mx-auto">
          {/* 1. ATTENDANCE: Accessible by ALL Roles */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AttendanceSystem />
          </div>

          {/* 2. REGISTER EMPLOYEE: HR and Admin Only */}
          {["HR", "Admin"].includes(userRole) && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <RegisterEmpTile
                onClick={() => console.log("Register Clicked")}
              />
            </div>
          )}

          {/* 3. SHIFT MANAGEMENT: Everyone except Security */}
          {userRole !== "Security" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <ShiftMgmtTile onClick={() => console.log("Shifts Clicked")} />
            </div>
          )}

          {/* 4. REPORTS: Admin, CEO, and Plant Manager */}
          {["Admin", "CEO", "Plant Manager"].includes(userRole) && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
              <ReportsTile onClick={() => console.log("Reports Clicked")} />
            </div>
          )}
        </div>
      </main>

      {/* Optional: Simple bottom footer for APK feel */}
      <footer className="p-6 text-center"></footer>
    </div>
  );
}
