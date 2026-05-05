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
  const [facingMode, setFacingMode] = useState("user");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isSwitchingRef = useRef(false); // guard against double-tap

  /** Fully release the active camera stream. */
  const releaseStream = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null; // detach first so browser frees hardware ref
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  /** Open camera with the given facingMode, retrying with relaxed constraints if needed. */
  const openCamera = async (facing) => {
    // Try strict 'exact' first — routes directly to the target lens on mobile
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      return;
    } catch {
      // exact failed (common on iOS simulator / single-cam devices) — fall through
    }

    // Retry with soft constraint (no 'exact')
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 640 } },
    });
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

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

      releaseStream();
      await openCamera(facingMode);
    } catch (err) {
      setError("Camera blocked or models missing.");
    }
  };

  // --- CAMERA SWITCH LOGIC ---
  const toggleCamera = async () => {
    if (isProcessing || isSwitchingRef.current) return;
    isSwitchingRef.current = true;

    const newFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);
    setError("");

    // Step 1: Fully release the current hardware stream
    releaseStream();

    // Step 2: Wait for the OS to fully free the camera sensor
    await new Promise((r) => setTimeout(r, 400));

    // Step 3: Open the new camera
    try {
      await openCamera(newFacing);
    } catch (err) {
      setError("Could not switch camera. Please try again.");
    } finally {
      isSwitchingRef.current = false;
    }
  };

  const resetToSelection = () => {
    releaseStream();
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
      if (!videoRef.current) throw new Error("Camera not initialized.");

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

      // 2. Prepare Payload & Auth
      const token = localStorage.getItem("auth_token");
      let currentUser = {};

      try {
        const ud = localStorage.getItem("user_details");
        if (ud && ud !== "undefined") currentUser = JSON.parse(ud);

        // Fallback for PWA persistence
        if (!currentUser._id) {
          const udata = localStorage.getItem("user_data");
          if (udata && udata !== "undefined") {
            const parsed = JSON.parse(udata);
            currentUser = parsed.user || parsed.agent || {};
          }
        }
      } catch (e) {
        console.warn("Storage parse error:", e);
      }

      // --- CRITICAL FIX: Ensure plant is a String ID, not an Object ---
      const plantId =
        currentUser.plant?.id ||
        currentUser.plant?._id ||
        currentUser.plant ||
        currentUser.plantId;

      const payload = {
        descriptor: Array.from(detection.descriptor),
        checkType: mode.toLowerCase(), // "in" or "out"
        plant: plantId,
        markedBy: currentUser._id,
      };

      console.log("Sending Verified Payload:", payload);

      // 3. API Call to Production
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

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Backend Error:", errorData);
        throw new Error(errorData.error || "Match failed on server.");
      }

      const data = await res.json();

      if (data.employee) {
        setScannedUser(data.employee);

        Swal.fire({
          icon: undefined,
          title: `<div style="font-weight:900; color:${mode === "IN" ? "#10b981" : "#ef4444"}; font-size: 1.25rem; letter-spacing: -0.025em; margin-top: 10px;">PUNCH ${mode} SUCCESS</div>`,
          html: `
            <div style="margin-top: 8px;">
              <span style="color: #028bcc; font-weight: 900; font-size: 1.5rem; text-transform: capitalize;">
                ${data.employee.name}
              </span>
            </div>
          `,
          timer: 2000,
          showConfirmButton: false,
          background: "#ffffff",
          customClass: {
            popup: "rounded-[3rem] shadow-2xl border-none p-10",
          },
        });

        setView("success");

        setTimeout(() => {
          setScannedUser(null);
          setView("camera");
          startTerminal(mode);
        }, 3000);
      }
    } catch (err) {
      console.error("💥 Attendance Error:", err.message);
      setError(err.message || "Face not recognized.");
      setIsProcessing(false);

      Swal.fire({
        title: "SCAN FAILED",
        text: err.message.includes("ObjectId")
          ? "System configuration error (Plant ID)."
          : "No matching face found.",
        icon: "error",
        confirmButtonColor: "#028bcc",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Dashboard logic remains the same...
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
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-gray-900/40 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 animate-in slide-in-from-bottom-10 duration-300">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  Attendance
                </h2>
                <button
                  onClick={() => setShowSelection(false)}
                  className="p-3 bg-gray-50 rounded-full text-gray-400"
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
                  className="w-full p-6 bg-green-50/50 border-2 border-transparent hover:border-green-500 rounded-[2rem] flex items-center gap-6"
                >
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                    <LogIn size={28} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-black text-gray-900">
                      Shift In
                    </h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Entry
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowSelection(false);
                    startTerminal("OUT");
                  }}
                  className="w-full p-6 bg-red-50/50 border-2 border-transparent hover:border-red-500 rounded-[2rem] flex items-center gap-6"
                >
                  <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                    <LogOut size={28} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-black text-gray-900">
                      Shift Out
                    </h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Exit
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
      {view === "camera" && (
        <div className="flex-1 flex flex-col items-center justify-between py-12 px-8">
          <div className="w-full flex justify-between items-center">
            <button
              onClick={resetToSelection}
              disabled={isProcessing}
              className="p-3 bg-gray-50 rounded-2xl text-gray-400"
            >
              <ArrowLeft size={20} />
            </button>
            <div
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${mode === "IN" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
            >
              Mode: {mode}
            </div>
            <button
              onClick={toggleCamera}
              disabled={isProcessing}
              className="p-3 bg-gray-50 rounded-2xl text-gray-400 active:scale-95 transition-all"
            >
              <RefreshCw size={20} />
            </button>
          </div>

          <div className="relative w-80 h-80 rounded-full border-[8px] border-gray-50 overflow-hidden bg-black shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
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
