"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  X,
  Search,
  Loader2,
  AlertCircle,
  User,
  Clock,
  CalendarDays,
  Building2,
  LogIn,
  LogOut,
} from "lucide-react";

const BASE = "https://production.srichakramilk.com";

export default function AttendanceLogsTile({ onClick }) {
  const todayStr = () => new Date().toISOString().slice(0, 10);

  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
  });

  const fetchLogs = async (date) => {
    setLoading(true);
    setError("");
    try {
      const qs = date ? `?date=${date}` : "";
      const res = await fetch(`${BASE}/api/hr/attendance${qs}`, {
        headers: headers(),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch attendance logs.");

      const records = data.attendance || [];
      // Sort newest dates first, then by employee name
      const sorted = records.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return (a.employee?.name || "").localeCompare(b.employee?.name || "");
      });
      setLogs(sorted);
    } catch (err) {
      setError("Failed to load attendance logs.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs(selectedDate);
    }
  }, [isOpen, selectedDate]);

  const handleOpen = () => {
    if (onClick) onClick();
    setSelectedDate(todayStr());
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
    setError("");
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "--:--";
    try {
      const [hours, minutes] = timeStr.split(":");
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return timeStr;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const empName = (log.employee?.name || "").toLowerCase();
    const empId = (log.employee?.empid || "").toLowerCase();
    const status = (log.status || "").toLowerCase();
    const plantName = (log.employee?.plant?.name || "").toLowerCase();
    
    return (
      empName.includes(query) ||
      empId.includes(query) ||
      status.includes(query) ||
      plantName.includes(query)
    );
  });

  return (
    <>
      {/* ── TILE ── */}
      <div className="w-full aspect-square">
        <button
          onClick={handleOpen}
          className="group relative w-full h-full bg-white rounded-[2.5rem] shadow-xl shadow-purple-100/40 border border-gray-50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all duration-200"
        >
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
            <ClipboardList size={28} strokeWidth={2.5} />
          </div>
          <div className="text-center px-2">
            <h3 className="text-[15px] font-black text-gray-800 leading-tight">
              Logs
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5 whitespace-nowrap">
              Attendance
            </p>
          </div>
        </button>
      </div>

      {/* ── BOTTOM SHEET OVERLAY ── */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="relative w-full h-[90vh] bg-white rounded-t-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-10 pb-6 flex items-center justify-between border-b border-gray-50 shrink-0">
              <div>
                <h2 className="text-2xl font-[900] text-gray-900 tracking-tight">
                  Attendance Logs
                </h2>
                <p className="text-[10px] font-black text-[#028bcc] uppercase tracking-[0.2em] mt-1">
                  {logs.length} record{logs.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 active:scale-95 transition-all hover:bg-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sticky Search + Date Filter */}
            <div className="px-8 py-4 bg-white border-b border-gray-50 shrink-0 space-y-3">
              {/* Search */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, ID, status, plant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-11 pr-5 text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#028bcc] focus:bg-white transition-all shadow-inner"
                />
              </div>

              {/* Date Picker */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#028bcc] pointer-events-none">
                  <CalendarDays size={17} />
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-blue-50/60 border border-[#028bcc]/20 rounded-2xl py-3.5 pl-11 pr-5 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#028bcc] focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Loader2 size={36} className="animate-spin text-[#028bcc]" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Fetching records...
                  </p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 border border-gray-100">
                    <ClipboardList size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                      No Records Found
                    </p>
                    <p className="text-xs text-gray-300 font-bold mt-1">
                      {searchQuery ? "Try a different search query" : "No attendance logs recorded yet"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pb-12">
                  {filteredLogs.map((log) => {
                    const statusColor = 
                      log.status === "Present" ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" :
                      log.status === "Half-Day" ? "bg-amber-50 text-amber-600 border-amber-100/50" :
                      "bg-red-50 text-red-500 border-red-100/50";
                      
                    return (
                      <div
                        key={log._id}
                        className="group relative bg-white border border-gray-100 hover:border-purple-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-300"
                      >
                        {/* Top Row */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-[17px] font-black text-gray-900 leading-tight truncate">
                                {log.employee?.name || "Unknown Employee"}
                              </h4>
                              <span className="text-[9px] font-black bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full uppercase shrink-0 tracking-wider">
                                {log.employee?.empid || "No ID"}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-gray-500 mt-2 flex items-center gap-1.5">
                              <CalendarDays size={12} className="text-[#028bcc]" />
                              <span>{formatDate(log.date)}</span>
                            </p>
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-1.5">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full font-black text-[9px] uppercase tracking-wider ${statusColor}`}>
                              {log.status || "Unknown"}
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <hr className="my-4 border-gray-50" />

                        {/* Time Punches Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm font-bold text-gray-700">
                          {/* Check In */}
                          <div className="bg-green-50/50 border border-green-100/50 rounded-2xl p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                              <LogIn size={14} />
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase text-green-600/70 tracking-widest">In Time</p>
                              <p className="text-sm font-black text-green-700 mt-0.5">{formatTime(log.checkIn)}</p>
                            </div>
                          </div>
                          
                          {/* Check Out */}
                          <div className="bg-red-50/50 border border-red-100/50 rounded-2xl p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                              <LogOut size={14} />
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase text-red-500/70 tracking-widest">Out Time</p>
                              <p className="text-sm font-black text-red-600 mt-0.5">{formatTime(log.checkOut)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Footer details */}
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
                          {log.employee?.plant?.name && (
                            <div className="flex items-center gap-1.5">
                              <Building2 size={12} />
                              {log.employee.plant.name}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
