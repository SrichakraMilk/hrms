"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  X,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import Swal from "sweetalert2";

const BASE = "https://production.srichakramilk.com";

function shiftIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("morning") || n.includes("day") || n.includes("general"))
    return <Sun size={20} className="text-yellow-500" />;
  if (n.includes("evening") || n.includes("afternoon"))
    return <Sunset size={20} className="text-orange-400" />;
  return <Moon size={20} className="text-indigo-400" />;
}

const EMPTY_FORM = {
  name: "",
  code: "",
  startTime: "",
  endTime: "",
  plant: "",
  department: "",
};

export default function ShiftMgmtTile({ onClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
  });

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [sRes, pRes, dRes] = await Promise.all([
        fetch(`${BASE}/api/shifts`, { headers: headers() }),
        fetch(`${BASE}/api/plants`, { headers: headers() }),
        fetch(`${BASE}/api/departments`, { headers: headers() }),
      ]);

      const [sData, pData, dData] = await Promise.all([
        sRes.json(),
        pRes.json(),
        dRes.json(),
      ]);

      setShifts(sData.shifts || sData || []);
      setPlants(pData.plants || pData || []);
      setDepartments(dData.departments || dData || []);
    } catch {
      setError("Failed to load data. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAll();
  }, [isOpen]);

  // ── Create shift ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name || !form.startTime || !form.endTime) {
      setError("Name, Start Time and End Time are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/shifts`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create shift.");
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchAll();
      Swal.fire({
        title: "Shift Created",
        text: `"${form.name}" has been added.`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
        background: "#ffffff",
        customClass: { popup: "rounded-[2rem] shadow-2xl p-8" },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete shift ───────────────────────────────────────────────────────────
  const handleDelete = async (shift) => {
    const confirm = await Swal.fire({
      title: "Delete Shift?",
      text: `Remove "${shift.name}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${BASE}/api/shifts?id=${shift._id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) throw new Error("Delete failed.");
      fetchAll();
    } catch {
      Swal.fire("Error", "Could not delete shift.", "error");
    }
  };

  const handleOpen = () => {
    if (onClick) onClick(); // allow parent to intercept if needed
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setError("");
  };

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <>
      {/* ── TILE ─────────────────────────────────────────────────────────── */}
      <div className="w-full aspect-square">
        <button
          onClick={handleOpen}
          className="group relative w-full h-full bg-white rounded-[2.5rem] shadow-xl shadow-orange-100/40 border border-gray-50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all duration-200"
        >
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
            <Clock size={28} strokeWidth={2.5} />
          </div>
          <div className="text-center px-2">
            <h3 className="text-[15px] font-black text-gray-800 leading-tight">
              Shifts
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5 whitespace-nowrap">
              Manage Timing
            </p>
          </div>
        </button>
      </div>

      {/* ── BOTTOM SHEET ─────────────────────────────────────────────────── */}
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
                  Shift Management
                </h2>
                <p className="text-[10px] font-black text-[#028bcc] uppercase tracking-[0.2em] mt-1">
                  {shifts.length} shift{shifts.length !== 1 ? "s" : ""} configured
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-11 h-11 bg-[#028bcc] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 active:scale-95 transition-all"
                  >
                    <Plus size={22} />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 active:scale-95 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* ── CREATE FORM ── */}
              {showForm && (
                <div className="bg-gray-50 rounded-[2rem] p-6 space-y-5 border border-gray-100 animate-in slide-in-from-top duration-300">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                    New Shift
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                        Shift Name *
                      </label>
                      <input
                        value={form.name}
                        onChange={f("name")}
                        placeholder="e.g. Morning Shift"
                        className="bg-white border border-gray-200 rounded-2xl py-4 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#028bcc] transition-all"
                      />
                    </div>

                    {/* Code */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                        Code
                      </label>
                      <input
                        value={form.code}
                        onChange={f("code")}
                        placeholder="e.g. MS"
                        className="bg-white border border-gray-200 rounded-2xl py-4 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#028bcc] transition-all"
                      />
                    </div>

                    {/* Start */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={f("startTime")}
                        className="bg-white border border-gray-200 rounded-2xl py-4 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#028bcc] transition-all"
                      />
                    </div>

                    {/* End */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={f("endTime")}
                        className="bg-white border border-gray-200 rounded-2xl py-4 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#028bcc] transition-all"
                      />
                    </div>

                    {/* Plant */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                        Plant
                      </label>
                      <select
                        value={form.plant}
                        onChange={f("plant")}
                        className="bg-white border border-gray-200 rounded-2xl py-4 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#028bcc] transition-all"
                      >
                        <option value="">All Plants</option>
                        {plants.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Department */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                        Department
                      </label>
                      <select
                        value={form.department}
                        onChange={f("department")}
                        className="bg-white border border-gray-200 rounded-2xl py-4 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#028bcc] transition-all"
                      >
                        <option value="">All Depts</option>
                        {departments.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setForm(EMPTY_FORM);
                        setError("");
                      }}
                      className="flex-1 py-4 rounded-[1.5rem] bg-gray-100 text-gray-500 font-black uppercase text-xs tracking-widest active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={saving}
                      className="flex-1 py-4 rounded-[1.5rem] bg-[#028bcc] text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Plus size={16} />
                      )}
                      {saving ? "Saving..." : "Create"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── SHIFT LIST ── */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 size={32} className="animate-spin text-[#028bcc]" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Loading shifts...
                  </p>
                </div>
              ) : shifts.length === 0 && !showForm ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 border border-gray-100">
                    <Clock size={36} />
                  </div>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                    No Shifts Yet
                  </p>
                  <p className="text-xs text-gray-300 font-bold">
                    Tap + to create your first shift
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shifts.map((shift) => (
                    <div
                      key={shift._id}
                      className="bg-white border border-gray-100 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm"
                    >
                      {/* Icon */}
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0">
                        {shiftIcon(shift.name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[15px] font-black text-gray-900 leading-tight truncate">
                            {shift.name}
                          </h4>
                          {shift.code && (
                            <span className="text-[9px] font-black bg-blue-50 text-[#028bcc] px-2 py-0.5 rounded-full uppercase shrink-0">
                              {shift.code}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          {shift.startTime || "—"} → {shift.endTime || "—"}
                        </p>
                        {(shift.plant?.name || shift.department?.name) && (
                          <p className="text-[10px] font-bold text-gray-300 mt-0.5">
                            {shift.plant?.name}
                            {shift.plant?.name && shift.department?.name && " · "}
                            {shift.department?.name}
                          </p>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(shift)}
                        className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-400 active:scale-90 transition-all shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
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
