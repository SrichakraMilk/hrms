"use client";

import React from "react";
import { BarChart3 } from "lucide-react";

export default function ReportsTile({ onClick }) {
  return (
    <div className="w-full aspect-square">
      <button
        onClick={onClick}
        className="group relative w-full h-full bg-white rounded-[2.5rem] shadow-xl shadow-blue-100/40 border border-gray-50 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all duration-200"
      >
        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
          <BarChart3 size={28} strokeWidth={2.5} />
        </div>

        <div className="text-center px-2">
          <h3 className="text-[15px] font-black text-gray-800 leading-tight">
            Reports
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5 whitespace-nowrap">
            View Analytics
          </p>
        </div>
      </button>
    </div>
  );
}
