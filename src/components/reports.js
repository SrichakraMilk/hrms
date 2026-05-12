"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  MapPin,
  Loader2,
  Search,
} from "lucide-react";

export default function AttendanceReport() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAttendance = async (date) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      // Appending date query parameter to your existing API
      const res = await fetch(
        `https://production.srichakramilk.com/api/hr/attendance?date=${date}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setAttendanceData(data.attendance || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate]);

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const filteredData = attendanceData.filter(
    (item) =>
      item.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employee?.empid?.includes(searchTerm),
  );

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="px-6 pt-8 pb-4 space-y-4 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-[900] text-gray-900 tracking-tight">
              Attendance Logs
            </h2>
            <p className="text-[10px] font-black text-[#028bcc] uppercase tracking-[0.2em] mt-1">
              EMPLOYEE ATTENDANCE REPORT
            </p>
          </div>
        </div>

        {/* Compact Date Strip */}
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-[1.8rem] border border-gray-100">
          <button
            onClick={prevDay}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="relative flex items-center gap-2">
            <span className="text-sm font-[1000] text-gray-900 uppercase tracking-tighter">
              {new Date(selectedDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
            <input
              type="date"
              value={selectedDate}
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <CalendarIcon size={16} className="text-[#028bcc]" />
          </div>
          <button
            onClick={nextDay}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* High-Contrast Search Bar */}
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search Name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 border border-gray-200 rounded-[1.5rem] py-4 pl-12 pr-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#028bcc] focus:bg-white transition-all shadow-inner placeholder-gray-400"
          />
        </div>
      </div>

      {/* DATA LISTING */}
{/* DATA LISTING */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24 custom-scrollbar">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#028bcc]" size={32} />
          </div>
        ) : filteredData.length > 0 ? (
          <div className="space-y-3">
            {filteredData.map((record) => (
              <div
                key={record._id}
                className="w-full grid grid-cols-[1.4fr_1fr_0.8fr] items-center bg-white rounded-[1.8rem] border border-gray-100 p-3.5 mb-3 shadow-sm active:scale-[0.98] transition-all animate-in slide-in-from-bottom duration-300"
              >
                {/* 1. Identity Section - Left Aligned */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 shrink-0 bg-blue-50 rounded-2xl flex items-center justify-center text-[#028bcc]">
                    <User size={22} strokeWidth={2.5} />
                  </div>
                  <div className="truncate">
                    <h4 className="text-[14px] font-[1000] text-gray-900 leading-none capitalize truncate">
                      {record.employee?.name}
                    </h4>
                    <span className="text-[9px] font-bold text-[#028bcc] uppercase mt-1 block tracking-tighter">
                      ID: {record.employee?.empid}
                    </span>
                  </div>
                </div>

                {/* 2. Punch Times Section - Center Aligned Grid */}
                <div className="grid grid-cols-2 border-x border-gray-50 px-2 text-center">
                  <div className="flex flex-col">
                    <p className="text-[7px] font-black text-gray-300 uppercase tracking-tighter mb-0.5">
                      Entry
                    </p>
                    <p className="text-[13px] font-[1000] text-gray-800 tracking-tighter">
                      {record.checkIn
                        ? new Date(record.checkIn).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : "--:--"}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[7px] font-black text-gray-300 uppercase tracking-tighter mb-0.5">
                      Exit
                    </p>
                    <p className="text-[13px] font-[1000] text-gray-800 tracking-tighter">
                      {record.checkOut
                        ? new Date(record.checkOut).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* 3. Status Section - Right Aligned */}
                <div className="flex flex-col items-end pr-1">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      record.status === "Present" ? "text-green-500" : "text-red-400"
                    }`}
                  >
                    {record.status}
                  </span>
                  <span className="text-[8px] font-bold text-gray-300 uppercase mt-0.5 tracking-tighter">
                    {record.source === "Face-ID" ? "BIOMETRIC" : "MANUAL"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-gray-300 gap-2">
            <Clock size={40} strokeWidth={1} />
            <p className="text-xs font-bold uppercase tracking-widest">
              No records found for this date
            </p>
          </div>
        )}
      </div>
    </div>
  );
}