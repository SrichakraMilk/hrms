"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  X,
  Plus,
  Loader2,
  AlertCircle,
  Search,
  User,
  Phone,
  UserCheck2,
  UserX2,
  Clock,
  Building2,
  Bookmark,
  FileText,
  FilePlus,
  LogOut,
} from "lucide-react";
import Swal from "sweetalert2";

const BASE = "https://production.srichakramilk.com";

const InputField = ({ label, placeholder, icon, value, onChange, required, type = "text" }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-black uppercase text-gray-400 ml-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-11 pr-5 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#028bcc] focus:bg-white transition-all shadow-inner"
      />
    </div>
  </div>
);

const EMPTY_VISITOR = {
  personName: "",
  mobileNumber: "",
  personToMeet: "",
  visitingPurpose: "",
  visitorBadgeNumber: "",
  remarks: "",
};

export default function VisitorsTile({ onClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("logs"); // "logs" or "add"
  const [visitors, setVisitors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(EMPTY_VISITOR);
  const [defaultPlantId, setDefaultPlantId] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
  });

  // Fetch recent visitors restricted by associated plant ID (with dynamic system fallbacks)
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch all plants to obtain a valid fallback plant ID
      let fallbackId = "";
      try {
        const pRes = await fetch(`${BASE}/api/plants`, { headers: headers() });
        const pData = await pRes.json();
        const plantsList = pData.plants || pData || [];
        fallbackId = plantsList[0]?._id || "";
        if (fallbackId) {
          setDefaultPlantId(fallbackId);
        }
      } catch (pe) {
        console.warn("Fallback plant retrieval error:", pe);
      }

      // 2. Extract logged-in user's plant ID
      let plantId = "";
      try {
        const ud = localStorage.getItem("user_details");
        if (ud && ud !== "undefined") {
          const currentUser = JSON.parse(ud);
          plantId = currentUser.plant?.id || currentUser.plant?._id || currentUser.plant || currentUser.plantId;
        }
      } catch (e) {
        console.warn("Storage parse error:", e);
      }

      const activePlantId = plantId || fallbackId;

      let url = `${BASE}/api/security?type=Visitor`;
      if (activePlantId) {
        url += `&plantId=${activePlantId}`;
      }

      const res = await fetch(url, { headers: headers() });
      const data = await res.json();

      if (res.ok) {
        setVisitors(data.entries || []);
      } else {
        throw new Error(data.error || "Failed to load visitors.");
      }
    } catch (err) {
      setError("Failed to synchronize with server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleOpen = () => {
    if (onClick) onClick();
    setIsOpen(true);
    setActiveTab("logs");
  };

  const handleClose = () => {
    setIsOpen(false);
    setForm(EMPTY_VISITOR);
    setError("");
    setSearchQuery("");
  };

  // Submit visitor log
  const handleRegisterVisitor = async (e) => {
    e.preventDefault();
    if (!form.personName || !form.mobileNumber || !form.personToMeet || !form.visitingPurpose) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      let plantId = "";
      try {
        const ud = localStorage.getItem("user_details");
        if (ud && ud !== "undefined") {
          const currentUser = JSON.parse(ud);
          plantId = currentUser.plant?.id || currentUser.plant?._id || currentUser.plant || currentUser.plantId;
        }
      } catch (e) {
        console.warn("Storage parse error:", e);
      }

      const activePlantId = plantId || defaultPlantId;

      const payload = {
        ...form,
        plant: activePlantId || undefined,
        entryType: "Visitor",
        status: "InPlant",
        date: new Date(),
        inTime: new Date(),
      };

      const res = await fetch(`${BASE}/api/security`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server rejected registration.");

      Swal.fire({
        title: "Visitor Registered",
        text: `${form.personName} has been logged inside.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        background: "#ffffff",
        customClass: { popup: "rounded-[2rem] shadow-2xl p-8" },
      });

      setForm(EMPTY_VISITOR);
      setActiveTab("logs");
      loadData();
    } catch (err) {
      setError(err.message || "Failed to register visitor.");
    } finally {
      setSaving(false);
    }
  };

  // Checkout Visitor (Mark Out)
  const handleCheckoutVisitor = async (visitor) => {
    const confirm = await Swal.fire({
      title: "Checkout Visitor?",
      text: `Mark checkout for ${visitor.personName}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#028bcc",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, checkout",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${BASE}/api/security?id=${visitor._id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          markOut: true,
          status: "Completed",
        }),
      });

      if (!res.ok) throw new Error("Checkout failed.");

      Swal.fire({
        title: "Checked Out",
        text: `${visitor.personName} has successfully checked out.`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });

      loadData();
    } catch (err) {
      Swal.fire("Error", "Could not complete checkout.", "error");
    }
  };

  const handleFieldChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const filteredVisitors = visitors.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      (v.personName || "").toLowerCase().includes(q) ||
      (v.mobileNumber || "").toLowerCase().includes(q) ||
      (v.personToMeet || "").toLowerCase().includes(q) ||
      (v.visitingPurpose || "").toLowerCase().includes(q) ||
      (v.visitorBadgeNumber || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* ── TILE ── */}
      <div className="w-full aspect-square">
        <button
          onClick={handleOpen}
          className="group relative w-full h-full bg-white rounded-[2.5rem] shadow-xl shadow-indigo-100/40 border border-gray-50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all duration-200"
        >
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            <ClipboardList size={28} strokeWidth={2.5} />
          </div>
          <div className="text-center px-2">
            <h3 className="text-[15px] font-black text-gray-800 leading-tight">
              Visitors
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5 whitespace-nowrap">
              Gate Passes
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
                  Visitor Management
                </h2>
                <p className="text-[10px] font-black text-[#028bcc] uppercase tracking-[0.2em] mt-1">
                  Active gate pass control
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 active:scale-95 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex px-8 border-b border-gray-100 shrink-0 bg-gray-50/50">
              <button
                onClick={() => setActiveTab("logs")}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-wider border-b-4 transition-all ${
                  activeTab === "logs"
                    ? "border-[#028bcc] text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Recent Logs
              </button>
              <button
                onClick={() => setActiveTab("add")}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-wider border-b-4 transition-all ${
                  activeTab === "add"
                    ? "border-[#028bcc] text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Log Visitor Entry
              </button>
            </div>

            {/* Scrollable Main Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* ── TAB 1: RECENT LOGS ── */}
              {activeTab === "logs" && (
                <div className="space-y-4 pb-12">
                  {/* Search Bar */}
                  <div className="relative mb-6">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Search size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Search visitors name, mobile, badges, purpose..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-11 pr-5 text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#028bcc] focus:bg-white transition-all shadow-inner"
                    />
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader2 size={36} className="animate-spin text-[#028bcc]" />
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Loading visitor registry...
                      </span>
                    </div>
                  ) : filteredVisitors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-gray-300 border border-gray-100">
                        <ClipboardList size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                          No Visitors Found
                        </p>
                        <p className="text-xs text-gray-300 font-bold mt-1">
                          {searchQuery ? "Try a different query" : "Visitor log is empty for today"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredVisitors.map((v) => {
                        const isInPlant = v.status === "InPlant";
                        return (
                          <div
                            key={v._id}
                            className={`relative bg-white border rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all duration-300 ${
                              isInPlant ? "border-blue-100 bg-blue-50/5" : "border-gray-100"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-[16px] font-black text-gray-900 truncate">
                                    {v.personName}
                                  </h4>
                                  {v.visitorBadgeNumber && (
                                    <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                      Badge: {v.visitorBadgeNumber}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs font-bold text-gray-500 mt-2 flex items-center gap-1.5">
                                  <User className="text-[#028bcc] shrink-0" size={13} />
                                  <span>To Meet: <span className="text-gray-800">{v.personToMeet}</span></span>
                                </p>
                              </div>

                              {/* Status badge / checkout button */}
                              <div>
                                {isInPlant ? (
                                  <button
                                    onClick={() => handleCheckoutVisitor(v)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 border border-red-100/50 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-xl font-black text-[10px] uppercase tracking-wider active:scale-95 transition-all"
                                  >
                                    <LogOut size={12} />
                                    Checkout
                                  </button>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-gray-400 font-black text-[9px] uppercase tracking-wider">
                                    Checked Out
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Info grid */}
                            <hr className="my-4 border-gray-50" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-bold text-gray-400">
                              <div className="flex items-center gap-2">
                                <Phone size={13} className="text-gray-300" />
                                <span className="text-gray-600">{v.mobileNumber}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Bookmark size={13} className="text-gray-300" />
                                <span className="text-gray-600 truncate">{v.visitingPurpose}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building2 size={13} className="text-gray-300" />
                                <span className="text-gray-600">{v.plant?.name || "Main Plant"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={13} className="text-gray-300" />
                                <span>
                                  In:{" "}
                                  <span className="text-gray-600">
                                    {v.inTime ? new Date(v.inTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                                  </span>
                                  {v.outTime && (
                                    <>
                                      {" • Out: "}
                                      <span className="text-gray-600">
                                        {new Date(v.outTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                            
                            {v.remarks && (
                              <div className="mt-4 p-3.5 bg-gray-50 rounded-2xl text-[11px] font-bold text-gray-500 border border-gray-100 flex gap-2 items-start">
                                <FileText size={13} className="text-gray-400 shrink-0 mt-0.5" />
                                <span>Remarks: {v.remarks}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 2: REGISTER VISITOR ENTRY FORM ── */}
              {activeTab === "add" && (
                <form onSubmit={handleRegisterVisitor} className="space-y-6 pb-12 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 gap-5">
                    {/* Visitor Name */}
                    <InputField
                      label="Visitor Name"
                      placeholder="Enter full name"
                      icon={<User size={18} />}
                      value={form.personName}
                      onChange={handleFieldChange("personName")}
                      required
                    />

                    {/* Mobile Number */}
                    <InputField
                      label="Contact Number"
                      placeholder="Enter 10-digit mobile"
                      icon={<Phone size={18} />}
                      value={form.mobileNumber}
                      onChange={handleFieldChange("mobileNumber")}
                      required
                    />

                    {/* Person to Meet */}
                    <InputField
                      label="Person to Meet"
                      placeholder="e.g. CEO, Plant Manager, etc."
                      icon={<User size={18} />}
                      value={form.personToMeet}
                      onChange={handleFieldChange("personToMeet")}
                      required
                    />

                    {/* Visiting Purpose */}
                    <InputField
                      label="Purpose of Visit"
                      placeholder="e.g. Interview, Audit, Maintenance"
                      icon={<Bookmark size={18} />}
                      value={form.visitingPurpose}
                      onChange={handleFieldChange("visitingPurpose")}
                      required
                    />



                    {/* Visitor Badge Number */}
                    <InputField
                      label="Badge / Ticket Number"
                      placeholder="e.g. Badge #12"
                      icon={<Clock size={18} />}
                      value={form.visitorBadgeNumber}
                      onChange={handleFieldChange("visitorBadgeNumber")}
                    />

                    {/* Remarks */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-black uppercase text-gray-400 ml-1">
                        Remarks
                      </label>
                      <textarea
                        placeholder="Add secondary notes, items carried, etc."
                        value={form.remarks}
                        onChange={handleFieldChange("remarks")}
                        rows={3}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#028bcc] focus:bg-white transition-all shadow-inner resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[#028bcc] py-6 rounded-[2rem] text-white font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <FilePlus size={20} />
                    )}
                    {saving ? "Registering..." : "Submit & Log Entry"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
