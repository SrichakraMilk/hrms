"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  Truck,
  Box,
  Flame,
  Droplets,
  Search,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";

const BASE = "https://production.srichakramilk.com";

// ─── Helpers ────────────────────────────────────────────────────────────────
const token = () =>
  typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token()}`,
});

function getPlantId() {
  try {
    const ud = localStorage.getItem("user_details");
    if (ud && ud !== "undefined") {
      const u = JSON.parse(ud);
      return u.plant?.id || u.plant?._id || u.plant || u.plantId || "";
    }
  } catch {}
  return "";
}

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Sub-tab definitions ────────────────────────────────────────────────────
const INWARD_SUBS = [
  { id: "MilkIn",     label: "Milk In",          icon: <Droplets size={14} />, entryType: "MilkIn"     },
  { id: "bmc",        label: "BMC Inward",        icon: <Truck   size={14} />, entryType: "BMCInward"  },
  { id: "GeneralIn",  label: "General Material",  icon: <Box     size={14} />, entryType: "GeneralIn"  },
  { id: "Firewood",   label: "Fire Wood",         icon: <Flame   size={14} />, entryType: "Firewood"   },
  { id: "VehicleIn",  label: "Vehicle Entry",     icon: <Truck   size={14} />, entryType: "VehicleIn"  },
];

const OUTWARD_SUBS = [
  { id: "MilkOut",    label: "Milk / Cream Out",  icon: <Droplets size={14} />, entryType: "MilkOut"   },
  { id: "GeneralOut", label: "General Material",  icon: <Box      size={14} />, entryType: "GeneralOut"},
  { id: "VehicleOut", label: "Vehicle Exit",      icon: <Truck    size={14} />, entryType: "VehicleOut"},
];

// ─── Empty form per entry type ───────────────────────────────────────────────
function emptyForm(entryType) {
  const base = {
    vehicleNumber: "",
    material: "",
    supplierName: "",
    customerName: "",
    weighbridgeTicketNumber: "",
    grossWeight: "",
    tareWeight: "",
    challanNumber: "",
    gatePassNumber: "",
    quantity: "",
    unit: "",
    remarks: "",
  };
  if (entryType === "MilkIn") return { ...base, material: "Milk" };
  if (entryType === "MilkOut") return { ...base, material: "Milk", outwardMaterialType: "Milk" };
  if (entryType === "Firewood") return { ...base, material: "Fire Wood" };
  if (entryType === "BMCInward") return { ...base };
  return base;
}

// ─── Field helper ───────────────────────────────────────────────────────────
function Field({ label, name, type = "text", value, onChange, required, options, readOnly }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {options ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#028bcc] transition-all"
        >
          {options.map((o) => (
            <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          readOnly={readOnly}
          className={`bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#028bcc] transition-all ${readOnly ? "opacity-60" : ""}`}
        />
      )}
    </div>
  );
}

// ─── Entry Form per entryType ────────────────────────────────────────────────
function EntryForm({ entryType, onSuccess }) {
  const [form, setForm] = useState(emptyForm(entryType));
  const [saving, setSaving] = useState(false);

  const netWeight =
    form.grossWeight && form.tareWeight
      ? Math.max(0, parseFloat(form.grossWeight) - parseFloat(form.tareWeight)).toFixed(2)
      : "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const plantId = getPlantId();
    setSaving(true);
    try {
      const payload = {
        ...form,
        entryType,
        plant: plantId || undefined,
        inTime: new Date(),
        status: entryType.endsWith("Out") ? "Completed" : "InPlant",
        ...(netWeight ? { netWeight: parseFloat(netWeight) } : {}),
      };
      const res = await fetch(`${BASE}/api/security`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create entry");

      Swal.fire({
        title: "Entry Recorded",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
        customClass: { popup: "rounded-[2rem] shadow-2xl" },
      });
      setForm(emptyForm(entryType));
      onSuccess();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const isWeighbridge = ["MilkIn", "MilkOut", "Firewood", "BMCInward", "GeneralIn", "GeneralOut", "VehicleIn", "VehicleOut"].includes(entryType);
  const isInward = !entryType.endsWith("Out");

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-10">

      {/* Vehicle Number */}
      <Field label="Vehicle Number" name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange} required />

      {/* Material */}
      {entryType === "MilkOut" ? (
        <Field
          label="Material Type"
          name="material"
          value={form.material}
          onChange={handleChange}
          options={[
            { value: "Milk", label: "Milk" },
            { value: "Curd", label: "Curd" },
            { value: "Cream", label: "Cream" },
          ]}
        />
      ) : entryType !== "VehicleIn" && entryType !== "VehicleOut" ? (
        <Field label="Material" name="material" value={form.material} onChange={handleChange} required={entryType !== "BMCInward"} />
      ) : null}

      {/* Party */}
      {isInward ? (
        <Field label="Supplier / Party Name" name="supplierName" value={form.supplierName} onChange={handleChange} />
      ) : (
        <>
          <Field label="Customer / Destination" name="customerName" value={form.customerName} onChange={handleChange} />
          <Field label="Gate Pass Number" name="gatePassNumber" value={form.gatePassNumber} onChange={handleChange} />
        </>
      )}

      {/* Challan */}
      {(entryType === "GeneralIn" || entryType === "BMCInward") && (
        <Field label="Challan / Invoice No" name="challanNumber" value={form.challanNumber} onChange={handleChange} />
      )}

      {/* Weighbridge */}
      {isWeighbridge && entryType !== "VehicleIn" && entryType !== "VehicleOut" && (
        <>
          <Field label="Weighbridge Ticket" name="weighbridgeTicketNumber" value={form.weighbridgeTicketNumber} onChange={handleChange} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Gross Wt (Kg)" name="grossWeight" type="number" value={form.grossWeight} onChange={handleChange} />
            <Field label="Tare Wt (Kg)" name="tareWeight" type="number" value={form.tareWeight} onChange={handleChange} />
            <Field label="Net Wt (Kg)" name="netWeight" type="number" value={netWeight} readOnly />
          </div>
        </>
      )}

      {/* Quantity for General Material */}
      {(entryType === "GeneralIn" || entryType === "GeneralOut") && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity" name="quantity" type="number" value={form.quantity} onChange={handleChange} />
          <Field
            label="Unit"
            name="unit"
            value={form.unit}
            onChange={handleChange}
            options={[
              { value: "", label: "Select" },
              { value: "Kg", label: "Kg" },
              { value: "Ltr", label: "Ltr" },
              { value: "Nos", label: "Nos" },
              { value: "Box", label: "Box" },
            ]}
          />
        </div>
      )}

      {/* Remarks */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Remarks</label>
        <textarea
          name="remarks"
          rows={2}
          value={form.remarks}
          onChange={handleChange}
          className="bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#028bcc] transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[#028bcc] py-5 rounded-[1.5rem] text-white font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60 text-sm"
      >
        {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
        {saving ? "Recording..." : "Record Entry"}
      </button>
    </form>
  );
}

// ─── Entry Logs List ─────────────────────────────────────────────────────────
function EntryLogs({ entryType, refreshKey }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const plantId = getPlantId();
    if (!plantId && !entryType) return;
    setLoading(true);
    fetch(`${BASE}/api/security?type=${entryType}${plantId ? `&plantId=${plantId}` : ""}`, {
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [entryType, refreshKey]);

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    return (
      (e.vehicleNumber || "").toLowerCase().includes(q) ||
      (e.material || "").toLowerCase().includes(q) ||
      (e.supplierName || "").toLowerCase().includes(q) ||
      (e.customerName || "").toLowerCase().includes(q) ||
      (e.serialNumber || "").toString().includes(q)
    );
  });

  const handleMarkOut = async (id) => {
    const confirm = await Swal.fire({
      title: "Mark as Out?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#028bcc",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, mark out",
    });
    if (!confirm.isConfirmed) return;
    await fetch(`${BASE}/api/security?id=${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ markOut: true }),
    });
    setEntries((prev) =>
      prev.map((e) =>
        e._id === id ? { ...e, status: "Completed", outTime: new Date().toISOString() } : e
      )
    );
  };

  return (
    <div className="space-y-3 pb-10">
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search vehicle, material, party..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#028bcc] transition-all"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={32} className="animate-spin text-[#028bcc]" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Fetching records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-gray-300 border border-gray-100">
            <Box size={28} />
          </div>
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No Records</p>
          <p className="text-xs text-gray-300 font-bold">{search ? "Try different keywords" : "No entries recorded yet"}</p>
        </div>
      ) : (
        filtered.map((entry) => {
          const isInPlant = entry.status === "InPlant";
          return (
            <div
              key={entry._id}
              className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${isInPlant ? "border-blue-100" : "border-gray-100"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.vehicleNumber && (
                      <span className="text-[15px] font-black text-gray-900">{entry.vehicleNumber}</span>
                    )}
                    {entry.serialNumber && (
                      <span className="text-[9px] font-black bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full uppercase"># {entry.serialNumber}</span>
                    )}
                  </div>
                  {entry.material && (
                    <p className="text-xs font-bold text-gray-500 mt-1">{entry.material}</p>
                  )}
                  <p className="text-xs font-bold text-gray-400 mt-0.5">
                    {entry.supplierName || entry.customerName || ""}
                    {entry.netWeight ? ` · ${entry.netWeight} Kg` : ""}
                    {entry.quantity ? ` · ${entry.quantity} ${entry.unit || ""}` : ""}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase ${isInPlant ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                    {isInPlant ? "In Plant" : "Completed"}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> In: {fmt(entry.inTime)}
                  </span>
                  {entry.outTime && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-emerald-500" /> Out: {fmt(entry.outTime)}
                    </span>
                  )}
                </div>
                {isInPlant && (
                  <button
                    onClick={() => handleMarkOut(entry._id)}
                    className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-red-50 text-red-500 border border-red-100 active:scale-95 transition-all flex items-center gap-1"
                  >
                    <ChevronRight size={12} /> Mark Out
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Section Tabs (Inwards / Outwards) ──────────────────────────────────────
function SectionPanel({ subs, accentColor }) {
  const [activeSub, setActiveSub] = useState(subs[0].id);
  const [view, setView] = useState("logs"); // "logs" | "add"
  const [refreshKey, setRefreshKey] = useState(0);

  const currentSub = subs.find((s) => s.id === activeSub) || subs[0];

  return (
    <div>
      {/* Sub-tab pill row */}
      <div className="flex gap-2 flex-wrap mb-5">
        {subs.map((sub) => (
          <button
            key={sub.id}
            onClick={() => { setActiveSub(sub.id); setView("logs"); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all border ${
              activeSub === sub.id
                ? `bg-[${accentColor}] text-white border-transparent shadow-md`
                : "bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200"
            }`}
            style={activeSub === sub.id ? { background: accentColor } : {}}
          >
            {sub.icon} {sub.label}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex border border-gray-100 rounded-2xl overflow-hidden mb-5">
        <button
          onClick={() => setView("logs")}
          className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all ${view === "logs" ? "bg-gray-900 text-white" : "text-gray-400 bg-white"}`}
        >
          Recent Logs
        </button>
        <button
          onClick={() => setView("add")}
          className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all ${view === "add" ? "bg-[#028bcc] text-white" : "text-gray-400 bg-white"}`}
        >
          + New Entry
        </button>
      </div>

      {view === "logs" ? (
        <EntryLogs entryType={currentSub.entryType} refreshKey={refreshKey} />
      ) : (
        <EntryForm
          entryType={currentSub.entryType}
          onSuccess={() => { setView("logs"); setRefreshKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}

// ─── Main Tile ───────────────────────────────────────────────────────────────
export default function SecurityDashboardTile({ onClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mainTab, setMainTab] = useState("inwards"); // "inwards" | "outwards"

  const handleOpen = () => {
    if (onClick) onClick();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setMainTab("inwards");
  };

  return (
    <>
      {/* ── TILE ── */}
      <div className="w-full aspect-square">
        <button
          onClick={handleOpen}
          className="group relative w-full h-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-gray-50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all duration-200"
        >
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-slate-700 group-hover:text-white transition-colors duration-300">
            <Shield size={28} strokeWidth={2.5} />
          </div>
          <div className="text-center px-2">
            <h3 className="text-[15px] font-black text-gray-800 leading-tight">Security</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5 whitespace-nowrap">
              Gate Control
            </p>
          </div>
        </button>
      </div>

      {/* ── BOTTOM SHEET ── */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative w-full h-[92vh] bg-white rounded-t-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-10 pb-5 flex items-center justify-between border-b border-gray-50 shrink-0">
              <div>
                <h2 className="text-2xl font-[900] text-gray-900 tracking-tight">Security Dashboard</h2>
                <p className="text-[10px] font-black text-[#028bcc] uppercase tracking-[0.2em] mt-1">
                  Gate & Material Control
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 active:scale-95 transition-all hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Inwards / Outwards tabs */}
            <div className="flex shrink-0 border-b border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setMainTab("inwards")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-wider border-b-4 transition-all ${
                  mainTab === "inwards"
                    ? "border-emerald-500 text-emerald-600 bg-white"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <ArrowDownCircle size={15} />
                Inwards
              </button>
              <button
                onClick={() => setMainTab("outwards")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-wider border-b-4 transition-all ${
                  mainTab === "outwards"
                    ? "border-red-500 text-red-500 bg-white"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <ArrowUpCircle size={15} />
                Outwards
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {mainTab === "inwards" ? (
                <SectionPanel subs={INWARD_SUBS} accentColor="#059669" />
              ) : (
                <SectionPanel subs={OUTWARD_SUBS} accentColor="#dc2626" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
