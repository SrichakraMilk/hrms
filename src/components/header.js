"use client";

import { useState } from "react";
import ChangePwdModal from "./changepwd";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  UserCheck,
  User,
  ShieldCheck,
  LogOut,
} from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/Maindash",
      icon: <LayoutDashboard size={18} />,
    },
    { name: "Attendance", href: "/Attendance", icon: <UserCheck size={18} /> },
    { name: "Profile", href: "/Profile", icon: <User size={18} /> },
    {
      name: "Change Password",
      href: "/Auth-security",
      icon: <ShieldCheck size={18} />,
    },
    {
      name: "Log out",
      href: "/",
      icon: <LogOut size={18} />,
      color: "text-red-500",
    },
  ];

  return (
    <header className="sticky top-0 z-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <Image
            src="/Logo1.png"
            alt="Srichakra Logo"
            width={140}
            height={40}
            className="object-contain w-auto h-auto"
            priority
          />
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-3 rounded-2xl transition-all duration-300 active:scale-90 floating-btn shadow-lg ${
            isOpen
              ? "bg-red-50 text-red-500 shadow-red-100"
              : "bg-white text-[#028bcc] shadow-blue-100 border border-gray-50"
          }`}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/5 backdrop-blur-[1px] z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-6 top-[85px] w-64 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 border border-gray-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col p-2">
              {menuItems.map((item, index) => {
                const isActive = pathname === item.href;
                // FIX: Check if this specific item is the Change Password item
                const isChangePassword = item.name === "Change Password";

                return (
                  <Link
                    key={index}
                    // FIX: If it's Change Pwd, use "#" to prevent navigation
                    href={isChangePassword ? "#" : item.href}
                    onClick={(e) => {
                      if (isChangePassword) {
                        e.preventDefault(); // Stop the 404 navigation
                        setIsPwdModalOpen(true); // Open the Modal
                      }
                      setIsOpen(false); // Always close the main menu
                    }}
                    className={`group relative flex items-center gap-4 px-5 py-4 text-[13px] font-black uppercase tracking-tight transition-all rounded-2xl overflow-hidden active:scale-95 ${
                      isActive
                        ? "text-[#028bcc]"
                        : item.color || "text-gray-700"
                    }`}
                  >
                    <div
                      className={`absolute inset-0 transition-all duration-300 ease-out z-0 ${
                        isActive
                          ? "w-full bg-blue-50/100"
                          : "w-0 bg-blue-50/80 group-hover:w-full"
                      }`}
                    />

                    <div className="relative z-10 flex items-center gap-4 w-full">
                      <div
                        className={`p-2 rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-[#028bcc] text-white scale-110 shadow-md shadow-blue-200"
                            : item.color
                              ? "bg-red-50"
                              : "bg-blue-50 group-hover:scale-110"
                        } ${!isActive && (item.color || "text-[#028bcc]")}`}
                      >
                        {item.icon}
                      </div>
                      <span
                        className={`transition-transform duration-300 ${!isActive && "group-hover:translate-x-1"}`}
                      >
                        {item.name}
                      </span>
                      {isActive && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 rounded-full bg-[#028bcc] animate-pulse" />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* MODAL TRIGGER COMPONENT */}
      <ChangePwdModal
        isOpen={isPwdModalOpen}
        onClose={() => setIsPwdModalOpen(false)}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `.floating-btn { animation: hoverFloat 3s ease-in-out infinite; } @keyframes hoverFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }`,
        }}
      />
    </header>
  );
}
