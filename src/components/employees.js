"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  X,
  Search,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  Building2,
  UserCheck2,
  UserX2,
} from "lucide-react";
import Swal from "sweetalert2";

const BASE = "https://production.srichakramilk.com";

export default function EmployeesTile({ onClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resettingId, setResettingId] = useState(null);

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
  });

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/hr/employees`, {
        headers: headers(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch employees.");
      
      const list = Array.isArray(data) ? data : data.employees || [];
      // Sort alphabetically by name
      const sorted = list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setEmployees(sorted);
    } catch (err) {
      setError("Failed to load employee directory.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const handleOpen = () => {
    if (onClick) onClick();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
    setError("");
  };

  const handleResetFace = async (emp) => {
    const result = await Swal.fire({
      title: "Reset Face ID?",
      text: `Are you sure you want to delete ${emp.name}'s face registration? This action is permanent.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Reset Registration",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      background: "#ffffff",
      customClass: { popup: "rounded-[2rem] shadow-2xl p-8" }
    });

    if (!result.isConfirmed) return;

    setResettingId(emp._id);
    try {
      const res = await fetch(
        `${BASE}/api/hr/face/descriptors?employeeId=${emp._id}`,
        {
          method: "DELETE",
          headers: headers(),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server rejected deletion.");

      Swal.fire({
        title: "Registration Reset",
        text: "The employee face records have been deleted.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        background: "#ffffff",
        customClass: { popup: "rounded-[2rem] shadow-2xl p-8" },
      });

      setEmployees((prev) =>
        prev.map((e) => (e._id === emp._id ? { ...e, face_id: null } : e))
      );
    } catch (err) {
      Swal.fire({
        title: "Error resetting face ID",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#028bcc",
      });
    } finally {
      setResettingId(null);
    }
  };

  // Filter logic
  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase();
    return (
      (emp.name || "").toLowerCase().includes(query) ||
      (emp.empid || "").toLowerCase().includes(query) ||
      (emp.mobile || "").toLowerCase().includes(query) ||
      (emp.designation?.name || "").toLowerCase().includes(query) ||
      (emp.department?.name || "").toLowerCase().includes(query) ||
      (emp.plant?.name || "").toLowerCase().includes(query)
    );
  });

  return (
    <>
      {/* ── TILE ── */}
      <div className="w-full aspect-square">
        <button
          onClick={handleOpen}
          className="group relative w-full h-full bg-white rounded-[2.5rem] shadow-xl shadow-blue-100/40 border border-gray-50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all duration-200"
        >
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            <Users size={28} strokeWidth={2.5} />
          </div>
          <div className="text-center px-2">
            <h3 className="text-[15px] font-black text-gray-800 leading-tight">
              Employees
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5 whitespace-nowrap">
              Directory List
            </p>
          </div>
        </button>
      </div>

      {/* ── BOTTOM SHEET OVERLAY ── */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="relative w-full h-[90vh] bg-white rounded-t-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-10 pb-6 flex items-center justify-between border-b border-gray-50 shrink-0">
              <div>
                <h2 className="text-2xl font-[900] text-gray-900 tracking-tight">
                  Employee Directory
                </h2>
                <p className="text-[10px] font-black text-[#028bcc] uppercase tracking-[0.2em] mt-1">
                  {employees.length} employee{employees.length !== 1 ? "s" : ""} registered
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 active:scale-95 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sticky Search bar */}
            <div className="px-8 py-4 bg-white border-b border-gray-50 shrink-0">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Search name, ID, phone, designation, plant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-11 pr-5 text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#028bcc] focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Error State */}
              {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* Loader */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Loader2 size={36} className="animate-spin text-[#028bcc]" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Fetching directory...
                  </p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 border border-gray-100">
                    <Users size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                      No Employees Found
                    </p>
                    <p className="text-xs text-gray-300 font-bold mt-1">
                      {searchQuery ? "Try a different search query" : "Employee directory is empty"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pb-12">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp._id}
                      className="group relative bg-white border border-gray-100 hover:border-blue-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-300"
                    >
                      {/* Flex Top Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-[17px] font-black text-gray-900 leading-tight truncate">
                              {emp.name}
                            </h4>
                            <span className="text-[9px] font-black bg-blue-50 text-[#028bcc] px-2.5 py-1 rounded-full uppercase shrink-0 tracking-wider">
                              {emp.empid || "No ID"}
                            </span>
                            {emp.employee_type && (
                              <span className="text-[9px] font-black bg-gray-50 text-gray-400 px-2.5 py-1 rounded-full uppercase shrink-0 tracking-wider">
                                {emp.employee_type}
                              </span>
                            )}
                          </div>

                          {/* Designation Row */}
                          {(emp.designation?.name || emp.department?.name) && (
                            <p className="text-xs font-bold text-gray-500 mt-2 flex items-center gap-1.5">
                              <Briefcase size={12} className="text-[#028bcc]" />
                              <span>
                                {emp.designation?.name || "No Designation"}
                                {emp.department?.name && ` · ${emp.department?.name}`}
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Status Icon/Badge */}
                        {/* Status Icon/Badge */}
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          {emp.isActive !== false ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-100/50 rounded-full text-green-600 font-black text-[9px] uppercase tracking-wider">
                              <UserCheck2 size={12} />
                              Active
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100/50 rounded-full text-red-500 font-black text-[9px] uppercase tracking-wider">
                              <UserX2 size={12} />
                              Inactive
                            </div>
                          )}

                          {emp.face_id && (
                            <div className="flex flex-col items-end gap-1 mt-0.5">
                              <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded border border-emerald-100">
                                ✓ Enrolled
                              </span>
                              <button
                                onClick={() => handleResetFace(emp)}
                                disabled={resettingId === emp._id}
                                className="text-[8px] font-black uppercase tracking-wider text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded border border-red-100 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                              >
                                {resettingId === emp._id ? "..." : "Reset Face"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      <hr className="my-4 border-gray-50" />

                      {/* Contact & Meta Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-bold text-gray-400">
                        {/* Mobile */}
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-gray-300 shrink-0" />
                          <span className={emp.mobile ? "text-gray-700" : "text-gray-300 italic"}>
                            {emp.mobile || "No Mobile"}
                          </span>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-gray-300 shrink-0" />
                          <span className={`${emp.email ? "text-gray-700 truncate" : "text-gray-300 italic"} max-w-[200px]`}>
                            {emp.email || "No Email"}
                          </span>
                        </div>

                        {/* Plant */}
                        {emp.plant?.name && (
                          <div className="flex items-center gap-2 col-span-1">
                            <Building2 size={13} className="text-gray-300 shrink-0" />
                            <span className="text-gray-700">{emp.plant?.name}</span>
                          </div>
                        )}

                        {/* Joining Date */}
                        <div className="flex items-center gap-2 col-span-1">
                          <Calendar size={13} className="text-gray-300 shrink-0" />
                          <span>
                            Joined:{" "}
                            <span className="text-gray-700">
                              {emp.joiningDate
                                ? new Date(emp.joiningDate).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
