"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UserCheck,
  Camera,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  LogIn,
  LogOut,
  RefreshCw,
  Clock,
  X,
} from "lucide-react";
import * as faceapi from "face-api.js";
import Swal from "sweetalert2";

export default function AttendanceSystem() {
  const [view, setView] = useState("dashboard"); // dashboard, camera, success
  const [showSelection, setShowSelection] = useState(false);
  const [mode, setMode] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedUser, setScannedUser] = useState(null);
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // --- 1. START TERMINAL ---
  const startTerminal = async (punchMode) => {
    setMode(punchMode);
    setView("camera");
    setError("");

    try {
      const URL =
        "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(URL),
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 640 },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError("Camera blocked or models missing.");
    }
  };

  const resetToSelection = () => {
    if (streamRef.current)
      streamRef.current.getTracks().forEach((t) => t.stop());
    setView("dashboard");
    setShowSelection(true);
    setScannedUser(null);
    setError("");
  };

  // --- 2. THE SCAN LOGIC ---
  const handleScan = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError("");

    try {
      // 1. Capture Face
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }),
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError("Face not detected. Please hold still.");
        setIsProcessing(false);
        return;
      }

      // 2. Prepare Payload
      const token = localStorage.getItem("auth_token");
      const currentUser = JSON.parse(
        localStorage.getItem("user_details") || "{}",
      );

      const payload = {
        descriptor: Array.from(detection.descriptor), // Must be a flat array
        checkType: mode.toLowerCase(), // "in" or "out"
        plant: currentUser.plantId || "656da6f8e7b3a1c2d3e4f5a6",
        markedBy: currentUser._id,
      };

      console.log(" Sending Payload:", payload);

      // 3. API Call
      const res = await fetch(
        "https://production.srichakramilk.com/api/hr/face/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      // 4. Handle 500 or Other Errors WITHOUT crashing
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Backend Error:", errorText);

        // Throw an error so the catch block handles the UI reset
        throw new Error("Match failed on server.");
      }

      const data = await res.json();

      if (data.employee) {
        setScannedUser(data.employee);

        // Show SweetAlert Identity
        Swal.fire({
          title: `<span style="font-weight:900;">PUNCH ${mode} SUCCESS</span>`,
          html: `<h2 style="color: #028bcc; font-weight: 900;">${data.employee.name}</h2>`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: "rounded-[2.5rem]" },
        });

        setView("success");

        setTimeout(() => {
          setScannedUser(null);
          setView("camera");
          startTerminal(mode);
        }, 3000);
      }
    } catch (err) {
      console.error("💥 UI Crash Prevented:", err.message);
      setError("Face not recognized or Server Error.");

      // Stop the spinner so the guard knows it failed
      setIsProcessing(false);

      Swal.fire({
        title: "SCAN FAILED",
        text: "Could not find a matching face in the database.",
        icon: "error",
        confirmButtonColor: "#028bcc",
      });
    } finally {
      // Ensure we don't stay in a loading state
      setIsProcessing(false);
    }
  };

  // --- DASHBOARD VIEW ---
  if (view === "dashboard") {
    return (
      <>
        <div className="w-full aspect-square">
          <button
            onClick={() => setShowSelection(true)}
            className="group relative w-full h-full bg-white rounded-[2.5rem] shadow-xl shadow-blue-100/40 border border-gray-50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all duration-200"
          >
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#028bcc] group-hover:bg-[#028bcc] group-hover:text-white transition-colors">
              <UserCheck size={28} strokeWidth={2.5} />
            </div>
            <div className="text-center px-2">
              <h3 className="text-[15px] font-black text-gray-800 leading-tight">
                Attendance
              </h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                Punch In/Out
              </p>
            </div>
          </button>
        </div>

        {showSelection && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl p-8 animate-in slide-in-from-bottom-10 duration-300 mb-0 sm:mb-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    Attendance 
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    Select Action
                  </p>
                </div>
                <button
                  onClick={() => setShowSelection(false)}
                  className="p-3 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 transition-colors active:scale-95"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    setShowSelection(false);
                    startTerminal("IN");
                  }}
                  className="w-full group p-6 bg-green-50/50 border-2 border-transparent hover:border-green-500 rounded-[2rem] flex items-center gap-6 transition-all active:scale-95"
                >
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <LogIn size={28} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-black text-gray-900">
                      Shift In
                    </h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      Entry Registration
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowSelection(false);
                    startTerminal("OUT");
                  }}
                  className="w-full group p-6 bg-red-50/50 border-2 border-transparent hover:border-red-500 rounded-[2rem] flex items-center gap-6 transition-all active:scale-95"
                >
                  <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <LogOut size={28} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-black text-gray-900">
                      Shift Out
                    </h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      Exit Registration
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* CAMERA VIEW */}
      {view === "camera" && (
        <div className="flex-1 flex flex-col items-center justify-between py-12 px-8">
          <div className="w-full flex justify-between items-center">
            <button
              onClick={resetToSelection}
              className="p-3 bg-gray-50 rounded-2xl text-gray-400"
            >
              <ArrowLeft size={20} />
            </button>
            <div
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${mode === "IN" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
            >
              Mode: {mode}
            </div>
            <div className="w-10"></div>
          </div>

          <div className="relative w-80 h-80 rounded-full border-[8px] border-gray-50 overflow-hidden bg-black shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div
              className={`absolute inset-0 border-4 rounded-full ${isProcessing ? "border-[#028bcc] border-dashed animate-spin" : "border-white/20"}`}
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-[#028bcc]/20 backdrop-blur-[2px] flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={48} />
              </div>
            )}
          </div>

          <div className="w-full space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100 animate-in shake">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-black text-gray-900 uppercase tracking-widest">
                Security Scan
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
                Ready for {mode} Punch
              </p>
            </div>
            <button
              onClick={handleScan}
              disabled={isProcessing}
              className={`w-full py-5 rounded-[2rem] text-white font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${mode === "IN" ? "bg-[#028bcc]" : "bg-red-500"}`}
            >
              {isProcessing ? (
                <RefreshCw className="animate-spin" />
              ) : (
                <Camera size={22} />
              )}
              {isProcessing ? "Processing..." : `Confirm ${mode}`}
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS SUMMARY VIEW */}
      {view === "success" && scannedUser && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center mb-6 text-green-500 border border-green-100 shadow-sm">
            <ShieldCheck size={48} />
          </div>

          <h3 className="text-2xl font-black text-gray-900 capitalize">
            {scannedUser.name}
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            ID: {scannedUser.empid}
          </p>

          <div className="mt-8 p-6 bg-gray-50 rounded-3xl w-full border border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase">
                Status
              </span>
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                Present
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase">
                Punch Type
              </span>
              <span
                className={`text-[10px] font-black uppercase ${mode === "IN" ? "text-[#028bcc]" : "text-red-500"}`}
              >
                {mode}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-[10px] font-black text-gray-400 uppercase">
                Timestamp
              </span>
              <span className="text-[10px] font-black text-gray-900">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          <p className="mt-8 text-[10px] font-black text-gray-300 uppercase animate-pulse">
            Ready for next scan...
          </p>
        </div>
      )}
    </div>
  );
}
