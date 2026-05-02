"use client";
import { useState } from "react";
import { X, Lock, Loader2, CheckCircle } from "lucide-react";

export default function ChangePwdModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: false,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: false });

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Sending exactly what the backend expects
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to change password.");

      setStatus({ loading: false, error: "", success: true });
      setTimeout(onClose, 2000);
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-gray-900">Change Password</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {status.success ? (
          <div className="text-center py-8">
            <CheckCircle className="text-green-500 mx-auto mb-2" size={48} />
            <p className="text-green-600 font-bold">Password Updated!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Current Password"
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-black border border-transparent focus:border-[#028bcc]"
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="New Password"
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-black border border-transparent focus:border-[#028bcc]"
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-black border border-transparent focus:border-[#028bcc]"
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />
            {status.error && (
              <p className="text-red-500 text-xs text-center font-bold">
                {status.error}
              </p>
            )}
            <button className="w-full bg-[#028bcc] text-white py-4 rounded-2xl font-bold shadow-lg flex justify-center items-center gap-2">
              {status.loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
