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
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-100 rounded-[1.25rem] py-4 pl-11 pr-5 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#028bcc] transition-all disabled:opacity-60"
      />
    </div>
  </div>
);

export default function RegisterEmpTile() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Identify, 2: Capture, 3: Success
  const [employeeId, setEmployeeId] = useState("");
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isQuickScanning, setIsQuickScanning] = useState(false);
  const [error, setError] = useState("");
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [allDescriptors, setAllDescriptors] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // 1. INITIALIZE MODELS & FETCH DESCRIPTORS
  useEffect(() => {
    const init = async () => {
      try {
        const URL =
          "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(URL),
        ]);

        const token = localStorage.getItem("auth_token");
        const res = await fetch(
          "https://production.srichakramilk.com/api/hr/face/descriptors",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        const list = data.descriptors || [];
        setAllDescriptors(list);

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
        console.error("Initialization failed", e);
      }
    };
    if (isOpen) init();
  }, [isOpen]);

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

      await new Promise((r) => setTimeout(r, 1500));

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
      const found = list.find((e) => e.empid?.toString() === employeeId);
      if (found) setEmployeeDetails(found);
      else setError("Employee ID not found.");
    } catch (err) {
      setError("Search failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEnroll = async () => {
    setIsRegistering(true);
    setError("");
    try {
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

      if (res.ok) setStep(3);
      else throw new Error("Server rejected enrollment.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRegistering(false);
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
                  Face Enrollment
                </h2>
                <p className="text-[10px] font-black text-[#028bcc] uppercase tracking-[0.2em] mt-1">
                  Stage {step} of 2
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-3 bg-gray-50 rounded-2xl text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8">
              {/* STAGE 1: IDENTIFY */}
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in zoom-in duration-300">
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
                      OR Manual
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
                    <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex items-center gap-4 animate-in zoom-in">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#028bcc] shadow-sm">
                        <User size={28} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#028bcc] uppercase mb-1">
                          Found
                        </p>
                        <h4 className="text-xl font-black text-gray-900 leading-none">
                          {employeeDetails.name}
                        </h4>
                      </div>
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
                    <button
                      onClick={() => {
                        stopStream();
                        setStep(2);
                      }}
                      className="w-full bg-[#028bcc] py-6 rounded-[2rem] text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                      Proceed to Capture
                    </button>
                  )}
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
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
