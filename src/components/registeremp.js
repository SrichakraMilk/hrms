"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UserPlus,
  X,
  User,
  Briefcase,
  Camera,
  CheckCircle2,
  RefreshCw,
  Search,
  Loader2,
  AlertCircle,
  ScanEye,
  ArrowLeft,
} from "lucide-react";
import * as faceapi from "face-api.js";
import Swal from "sweetalert2";

const InputGroup = ({
  label,
  placeholder,
  icon,
  value,
  onChange,
  disabled,
  type = "text",
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-[11px] font-black uppercase text-gray-400 ml-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
        {icon}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-100 rounded-[1.25rem] py-4 pl-11 pr-5 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#028bcc] transition-all disabled:opacity-60"
      />
    </div>
  </div>
);

const SelectGroup = ({ label, icon, value, onChange, options, disabled }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[11px] font-black uppercase text-gray-400 ml-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
        {icon}
      </div>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-gray-50 border border-gray-100 rounded-[1.25rem] py-4 pl-11 pr-5 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#028bcc] transition-all disabled:opacity-60 appearance-none"
      >
        <option value="">-- Select --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

const EMPTY_EMP = {
  empid: "",
  name: "",
  mobile: "",
  email: "",
  designation: "",
  plant: "",
  department: "",
  employee_type: "Full-Time",
};

export default function RegisterEmpTile() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("face"); // "face" or "employee"
  const [step, setStep] = useState(1); // 1: Identify, 2: Capture, 3: Success
  const [employeeId, setEmployeeId] = useState("");
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isQuickScanning, setIsQuickScanning] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [savingEmp, setSavingEmp] = useState(false);
  const [error, setError] = useState("");
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [allDescriptors, setAllDescriptors] = useState([]);
  const [facingMode, setFacingMode] = useState("user");
  const [empForm, setEmpForm] = useState(EMPTY_EMP);

  // Lookup Data States
  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Statistical Enrollment Tracking States
  const [allEmployees, setAllEmployees] = useState([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [notEnrolledCount, setNotEnrolledCount] = useState(0);
  const [unenrolledList, setUnenrolledList] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // 1. INITIALIZE MODELS & FETCH DESCRIPTORS & STATS
  const fetchStatsAndData = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem("auth_token");
      const [res, empRes, pRes, dRes, desigRes] = await Promise.all([
        fetch("https://production.srichakramilk.com/api/hr/face/descriptors", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("https://production.srichakramilk.com/api/hr/employees", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("https://production.srichakramilk.com/api/plants", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("https://production.srichakramilk.com/api/departments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("https://production.srichakramilk.com/api/designations", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (pRes?.ok) {
        const pData = await pRes.json();
        setPlants(
          (pData.plants || pData || []).map((p) => ({ value: p._id, label: p.name }))
        );
      }
      if (dRes?.ok) {
        const dData = await dRes.json();
        setDepartments(
          (dData.departments || dData || []).map((d) => ({ value: d._id, label: d.name }))
        );
      }
      if (desigRes?.ok) {
        const desigData = await desigRes.json();
        setDesignations(
          (desigData.designations || desigData || []).map((d) => ({ value: d._id, label: d.name }))
        );
      }

      const data = await res.json();
      const list = data.descriptors || [];
      setAllDescriptors(list);

      const empData = await empRes.json();
      const empList = Array.isArray(empData) ? empData : empData.employees || [];
      
      // Keep only active employees for stats tracking
      const activeEmps = empList.filter((e) => e.isActive !== false);
      setAllEmployees(activeEmps);

      const enrolledIds = new Set(list.map((d) => d.employeeId?.toString()));
      const enrolled = activeEmps.filter((e) => enrolledIds.has(e._id?.toString()));
      const unenrolled = activeEmps.filter((e) => !enrolledIds.has(e._id?.toString()));

      setEnrolledCount(enrolled.length);
      setNotEnrolledCount(unenrolled.length);
      setUnenrolledList(unenrolled.sort((a, b) => (a.name || "").localeCompare(b.name || "")));

      if (list.length > 0) {
        const labeled = list.map((item) => {
          const descriptions = item.descriptors.map(
            (d) => new Float32Array(d),
          );
          return new faceapi.LabeledFaceDescriptors(item.name, descriptions);
        });
        setFaceMatcher(new faceapi.FaceMatcher(labeled, 0.6));
      }
    } catch (e) {
      console.error("Failed to load enrollment statistics", e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    const initModelsAndLoad = async () => {
      try {
        const URL =
          "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(URL),
        ]);
        await fetchStatsAndData();
      } catch (e) {
        console.error("Initialization failed", e);
      }
    };
    if (isOpen) {
      initModelsAndLoad();
    }
  }, [isOpen]);

  // Start camera when entering Step 2 (Capture)
  useEffect(() => {
    if (step === 2 || (step === 1 && isQuickScanning)) {
      const startCamera = async () => {
        try {
          // Clean up previous stream to allow hardware switching
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 640 },
              height: { ideal: 640 },
            },
          });
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          setError("Camera access denied or unavailable.");
        }
      };
      startCamera();
    }
  }, [step, facingMode, isQuickScanning]);

  const stopStream = () => {
    if (streamRef.current)
      streamRef.current.getTracks().forEach((t) => t.stop());
  };

  // 2. QUICK VERIFY LOGIC (Client-Side Match)
  const handleQuickVerify = async () => {
    setIsQuickScanning(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) videoRef.current.srcObject = stream;

      if (!videoRef.current) throw new Error("Camera not initialized.");

      await new Promise((resolve) => {
        if (videoRef.current.readyState >= 2) resolve();
        else videoRef.current.onloadedmetadata = () => resolve();
      });

      await new Promise((r) => setTimeout(r, 500));

      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) throw new Error("No face detected. Align clearly.");
      if (!faceMatcher) throw new Error("No existing records found to match.");

      const match = faceMatcher.findBestMatch(detection.descriptor);

      if (match.label !== "unknown") {
        const emp = allDescriptors.find((d) => d.name === match.label);
        setEmployeeDetails(emp);
        setEmployeeId(emp.empid);
        Swal.fire({
          title: "ALREADY ENROLLED",
          text: `Identified as ${emp.name}`,
          icon: "info",
          confirmButtonColor: "#028bcc",
        });
        setIsQuickScanning(false);
        stopStream();
      } else {
        setError("Identity not found. Enter ID manually to enroll.");
        setIsQuickScanning(false);
        stopStream();
      }
    } catch (err) {
      setError(err.message);
      setIsQuickScanning(false);
      stopStream();
    }
  };

  const handleManualSearch = async () => {
    if (!employeeId) return;
    setIsVerifying(true);
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(
        "https://production.srichakramilk.com/api/hr/employees",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.employees || [];
      const found = list.find((e) => e.empid?.toString().toUpperCase().trim() === employeeId.toUpperCase().trim());
      if (found) setEmployeeDetails(found);
      else setError("Employee ID not found.");
    } catch (err) {
      setError("Search failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetFace = async () => {
    if (!employeeDetails) return;
    const result = await Swal.fire({
      title: "Reset Face ID?",
      text: `Are you sure you want to delete ${employeeDetails.name}'s face registration? This action is permanent.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Reset Registration",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      background: "#ffffff",
      customClass: {
        popup: "rounded-[2rem] shadow-2xl p-8"
      }
    });

    if (!result.isConfirmed) return;

    setIsResetting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(
        `https://production.srichakramilk.com/api/hr/face/descriptors?employeeId=${employeeDetails._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
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

      // Update local state to reflect that face is reset
      setEmployeeDetails({ ...employeeDetails, face_id: null });
      fetchStatsAndData(); // refresh count numbers!
    } catch (err) {
      Swal.fire({
        title: "Error resetting face ID",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#028bcc",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleEnroll = async () => {
    setIsRegistering(true);
    setError("");
    try {
      if (!videoRef.current) throw new Error("Camera not initialized.");

      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) throw new Error("Capture failed. Stay still.");

      const token = localStorage.getItem("auth_token");
      const res = await fetch(
        "https://production.srichakramilk.com/api/hr/face/descriptors",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employeeId: employeeDetails._id,
            descriptor: Array.from(detection.descriptor),
            label: "front",
          }),
        },
      );

      if (res.ok) {
        stopStream();
        setStep(3);
        fetchStatsAndData(); // Refresh stats in background!
      } else throw new Error("Server rejected enrollment.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegisterEmployee = async () => {
    if (!empForm.empid || !empForm.name || !empForm.mobile || !empForm.designation || !empForm.plant || !empForm.department) {
      Swal.fire({
        title: "Missing Fields",
        text: "Please fill in all the required fields.",
        icon: "warning",
        confirmButtonColor: "#028bcc",
      });
      return;
    }

    setSavingEmp(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("https://production.srichakramilk.com/api/hr/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(empForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register employee");

      Swal.fire({
        title: "Employee Registered!",
        text: `${empForm.name} has been successfully registered.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        background: "#ffffff",
        customClass: { popup: "rounded-[2rem] shadow-2xl p-8" },
      });

      // Clear form and switch to face tab to instantly enroll their face!
      setEmpForm(EMPTY_EMP);
      setActiveTab("face");
      setEmployeeId(data.employee?.empid || empForm.empid);
      
      // We can also trigger a re-fetch of stats so they appear in the Unenrolled list immediately!
      fetchStatsAndData();

    } catch (err) {
      Swal.fire({
        title: "Registration Error",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setSavingEmp(false);
    }
  };

  const handleClose = () => {
    stopStream();
    setIsOpen(false);
    setStep(1);
    setEmployeeId("");
    setEmployeeDetails(null);
    setIsQuickScanning(false);
  };

  return (
    <>
      {/* TILE */}
      <div className="w-full aspect-square">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-full h-full bg-white rounded-[2.5rem] shadow-xl border border-gray-50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <UserPlus size={28} />
          </div>
          <div className="text-center">
            <h3 className="text-[15px] font-black text-gray-800 leading-tight">
              Enroll
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
              Face ID Link
            </p>
          </div>
        </button>
      </div>

      {/* UNIFORM SHEET OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="relative w-full h-[90vh] bg-white rounded-t-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-10 pb-6 flex items-center justify-between border-b border-gray-50">
              <div>
                <h2 className="text-2xl font-[900] text-gray-900 tracking-tight">
                  {activeTab === "face" ? "Face Enrollment" : "Employee Registration"}
                </h2>
                {activeTab === "face" && (
                  <p className="text-[10px] font-black text-[#028bcc] uppercase tracking-[0.2em] mt-1">
                    Stage {step} of 2
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* TAB SELECTOR */}
            {step === 1 && (
              <div className="px-8 pt-6">
                <div className="flex p-1 bg-gray-100/50 rounded-2xl border border-gray-100">
                  <button
                    onClick={() => setActiveTab("face")}
                    className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                      activeTab === "face"
                        ? "bg-white text-[#028bcc] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Face Enroll
                  </button>
                  <button
                    onClick={() => setActiveTab("employee")}
                    className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                      activeTab === "employee"
                        ? "bg-white text-[#028bcc] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Employee Enroll
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-8 py-8">
              {/* FACE ENROLLMENT: STAGE 1 */}
              {activeTab === "face" && step === 1 && (
                <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                  {/* ENROLLMENT STATS SUMMARY */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50/60 border border-emerald-100/50 rounded-3xl p-5 flex flex-col justify-center shadow-sm">
                      <span className="text-[10px] font-black uppercase text-emerald-600/80 tracking-wider">
                        Enrolled
                      </span>
                      <span className="text-3xl font-[900] text-emerald-700 mt-1">
                        {loadingStats ? "..." : enrolledCount}
                      </span>
                    </div>
                    <div className="bg-amber-50/60 border border-amber-100/50 rounded-3xl p-5 flex flex-col justify-center shadow-sm">
                      <span className="text-[10px] font-black uppercase text-amber-600/80 tracking-wider">
                        Not Enrolled
                      </span>
                      <span className="text-3xl font-[900] text-amber-700 mt-1">
                        {loadingStats ? "..." : notEnrolledCount}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    {!isQuickScanning ? (
                      <button
                        onClick={handleQuickVerify}
                        className="w-full py-5 rounded-[2rem] border-2 border-dashed border-blue-100 flex items-center justify-center gap-3 text-[#028bcc] font-black text-[11px] uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95"
                      >
                        <ScanEye size={20} /> Quick Verify by Face
                      </button>
                    ) : (
                      <div className="relative w-full aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        <div className="absolute inset-0 border-4 border-[#028bcc] border-dashed rounded-[2rem] animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="mx-4 text-[10px] font-black text-gray-300 uppercase">
                      OR Manual ID Search
                    </span>
                    <div className="flex-grow border-t border-gray-100"></div>
                  </div>

                  <InputGroup
                    label="Employee Search"
                    placeholder="Enter Emp ID (e.g. 001)"
                    icon={<Briefcase size={18} />}
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                  />

                  {employeeDetails && (
                    <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex items-center justify-between gap-4 animate-in zoom-in">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#028bcc] shadow-sm shrink-0">
                          <User size={28} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-[#028bcc] uppercase mb-1">
                            Found
                          </p>
                          <h4 className="text-xl font-black text-gray-900 leading-none truncate">
                            {employeeDetails.name}
                          </h4>
                          {employeeDetails.face_id && (
                            <span className="inline-block mt-2 px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-md border border-emerald-100">
                              ✓ Enrolled
                            </span>
                          )}
                        </div>
                      </div>

                      {employeeDetails.face_id && (
                        <button
                          onClick={handleResetFace}
                          disabled={isResetting}
                          className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl active:scale-95 transition-all shrink-0"
                        >
                          {isResetting ? "Resetting..." : "Reset Face"}
                        </button>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  {!employeeDetails ? (
                    <button
                      onClick={handleManualSearch}
                      disabled={!employeeId || isVerifying}
                      className="w-full bg-gray-900 py-6 rounded-[2rem] text-white font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                      {isVerifying ? (
                        <Loader2 className="animate-spin mx-auto" />
                      ) : (
                        "Verify ID"
                      )}
                    </button>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setEmployeeId("");
                          setEmployeeDetails(null);
                          setError("");
                        }}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-100 py-6 rounded-[2rem] text-gray-700 font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all"
                      >
                        Clear Search
                      </button>
                      <button
                        onClick={() => {
                          stopStream();
                          setStep(2);
                        }}
                        className="flex-[2] bg-[#028bcc] py-6 rounded-[2rem] text-white font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-blue-600 active:scale-95 transition-all"
                      >
                        Proceed to Capture
                      </button>
                    </div>
                  )}

                  {/* UNENROLLED QUICK ACCESS SECTION */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-wider">
                        Quick Enroll (Unenrolled)
                      </h4>
                      <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                        {unenrolledList.length} remaining
                      </span>
                    </div>

                    {loadingStats ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <Loader2 size={24} className="animate-spin text-[#028bcc]" />
                        <span className="text-[10px] font-bold text-gray-300 uppercase">Updating directory...</span>
                      </div>
                    ) : unenrolledList.length === 0 ? (
                      <div className="text-center py-6 text-xs font-bold text-gray-300 uppercase">
                        🎉 All active employees enrolled!
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                        {unenrolledList.map((emp) => (
                          <div
                            key={emp._id}
                            className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-black text-gray-800 leading-tight truncate">
                                {emp.name}
                              </p>
                              <p className="text-[10px] font-bold text-gray-400 mt-1">
                                {emp.empid} • {emp.designation?.name || "No Designation"}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setEmployeeDetails(emp);
                                setEmployeeId(emp.empid);
                                setStep(2);
                              }}
                              className="bg-[#028bcc] text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl hover:bg-blue-600 active:scale-95 transition-all shadow-sm shrink-0"
                            >
                              Enroll
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STAGE 2: CAPTURE */}
              {step === 2 && (
                <div className="flex flex-col items-center justify-center py-6 animate-in slide-in-from-right duration-300">
                  <div className="relative w-80 h-80 rounded-full border-[10px] border-gray-50 overflow-hidden bg-black shadow-2xl mb-12">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                    />
                    <button
                      onClick={() =>
                        setFacingMode((prev) =>
                          prev === "user" ? "environment" : "user",
                        )
                      }
                      className="absolute top-6 right-6 p-4 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl text-white active:scale-90 transition-all z-50"
                    >
                      <RefreshCw size={24} />
                    </button>
                    {isRegistering && (
                      <div className="absolute inset-0 bg-[#028bcc]/20 flex items-center justify-center backdrop-blur-[2px]">
                        <Loader2
                          className="animate-spin text-white"
                          size={48}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-center mb-12">
                    <h3 className="text-2xl font-[900] text-gray-900">
                      Biometric Scan
                    </h3>
                    <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-[0.2em]">
                      Linking: {employeeDetails?.name}
                    </p>
                  </div>
                  <button
                    onClick={handleEnroll}
                    disabled={isRegistering}
                    className="w-full bg-[#028bcc] py-6 rounded-[2rem] text-white font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                  >
                    {isRegistering ? (
                      <RefreshCw className="animate-spin" />
                    ) : (
                      <Camera size={24} />
                    )}
                    {isRegistering ? "Processing..." : "Capture & Link"}
                  </button>
                </div>
              )}

              {/* STAGE 3: SUCCESS */}
              {step === 3 && (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-500">
                  <div className="w-28 h-28 bg-green-50 rounded-[3rem] flex items-center justify-center mb-8 text-green-500 border-2 border-green-100 shadow-sm">
                    <CheckCircle2 size={64} />
                  </div>
                  <h3 className="text-3xl font-[900] text-gray-900">
                    Enrolled!
                  </h3>
                  <p className="text-sm font-bold text-gray-400 mt-4 px-12 leading-relaxed">
                    Face ID for {employeeDetails?.name} has been securely linked
                    to ID {employeeId}.
                  </p>
                  <button
                    onClick={handleClose}
                    className="w-full bg-gray-900 py-6 rounded-[2rem] text-white font-black uppercase mt-16 active:scale-95 transition-all"
                  >
                    Finish Setup
                  </button>
                </div>
              )}

              {/* EMPLOYEE ENROLLMENT TAB */}
              {activeTab === "employee" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup
                      label="Employee ID"
                      placeholder="e.g. EMP001"
                      icon={<User size={18} />}
                      value={empForm.empid}
                      onChange={(e) => setEmpForm((p) => ({ ...p, empid: e.target.value }))}
                      required
                    />
                    <InputGroup
                      label="Full Name"
                      placeholder="e.g. John Doe"
                      icon={<User size={18} />}
                      value={empForm.name}
                      onChange={(e) => setEmpForm((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup
                      label="Mobile Number"
                      placeholder="10-digit number"
                      type="tel"
                      icon={<Briefcase size={18} />}
                      value={empForm.mobile}
                      onChange={(e) => setEmpForm((p) => ({ ...p, mobile: e.target.value }))}
                      required
                    />
                    <InputGroup
                      label="Email (Optional)"
                      placeholder="john@example.com"
                      type="email"
                      icon={<Briefcase size={18} />}
                      value={empForm.email}
                      onChange={(e) => setEmpForm((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <SelectGroup
                      label="Plant"
                      icon={<Briefcase size={18} />}
                      value={empForm.plant}
                      onChange={(e) => setEmpForm((p) => ({ ...p, plant: e.target.value }))}
                      options={plants}
                      required
                    />
                    <SelectGroup
                      label="Department"
                      icon={<Briefcase size={18} />}
                      value={empForm.department}
                      onChange={(e) => setEmpForm((p) => ({ ...p, department: e.target.value }))}
                      options={departments}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <SelectGroup
                      label="Designation"
                      icon={<Briefcase size={18} />}
                      value={empForm.designation}
                      onChange={(e) => setEmpForm((p) => ({ ...p, designation: e.target.value }))}
                      options={designations}
                      required
                    />
                    <SelectGroup
                      label="Employee Type"
                      icon={<Briefcase size={18} />}
                      value={empForm.employee_type}
                      onChange={(e) => setEmpForm((p) => ({ ...p, employee_type: e.target.value }))}
                      options={[
                        { value: "Full-Time", label: "Full-Time" },
                        { value: "Part-Time", label: "Part-Time" },
                        { value: "Contract", label: "Contract" },
                      ]}
                      required
                    />
                  </div>
                  
                  <button
                    onClick={handleRegisterEmployee}
                    disabled={savingEmp}
                    className="w-full bg-[#028bcc] py-6 rounded-[2rem] text-white font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all mt-6"
                  >
                    {savingEmp ? (
                      <Loader2 className="animate-spin mx-auto" />
                    ) : (
                      "Register Employee"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
