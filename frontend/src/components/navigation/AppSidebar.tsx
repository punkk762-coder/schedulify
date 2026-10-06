"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useNavigation } from "./NavigationProvider";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  description: string;
  badge?: string;
}

export function AppSidebar() {
  const { isSidebarOpen, closeSidebar } = useNavigation();
  const pathname = usePathname();
  const router = useRouter();

  const primaryNavItems: NavItem[] = [
    {
      name: "Today",
      href: "/today",
      icon: "☀️",
      description: "Live daily checklist, meals & macros",
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: "📅",
      description: "Weekly schedule & occurrences",
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: "📊",
      description: "Adherence streaks & macro telemetry",
    },
    {
      name: "AI Coach Studio",
      href: "/chat",
      icon: "💬",
      description: "Full Gemini chat & protocol logging",
      badge: "Gemini",
    },
    {
      name: "History",
      href: "/history",
      icon: "📜",
      description: "Past completions & adherence archive",
    },
  ];

  const managementNavItems: NavItem[] = [
    {
      name: "Mom's Kitchen Deck",
      href: "/mom",
      icon: "🍲",
      description: "Household prep & meal coordination",
    },
    {
      name: "Protocol Setup Wizard",
      href: "/setup",
      icon: "🚀",
      description: "Biometrics, routine phases & calorie limits",
    },
    {
      name: "Settings & System",
      href: "/settings",
      icon: "⚙️",
      description: "Alarms, Gemini Quota & UptimeRobot",
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      closeSidebar();
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <>
      {/* ─── Backdrop Blur Overlay ─── */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* ─── Slide-Over Sidebar Drawer ─── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[300px] sm:w-[340px] bg-white border-r border-[#dfc0b7] shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main Navigation Sidebar"
      >
        {/* Top Header */}
        <div className="p-4 border-b border-[#dfc0b7] flex items-center justify-between shrink-0 bg-[#fcf2e6]/40">
          <Link
            href="/today"
            onClick={closeSidebar}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#ffdbd1] flex items-center justify-center text-[#a43716] font-serif font-bold text-lg border border-[#a43716]/20 shadow-2xs group-hover:scale-105 transition-transform">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-base text-[#1f1b14] leading-tight">
                  Schedulfy
                </span>
                <span className="text-[9px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-[#a43716]/10 text-[#a43716]">
                  Studio
                </span>
              </div>
              <span className="text-[10px] text-[#8b716a] font-mono block">
                Personal Routine OS
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeSidebar}
            className="w-8 h-8 rounded-xl border border-[#dfc0b7] bg-white hover:bg-[#fcf2e6] text-[#58423c] hover:text-[#1f1b14] flex items-center justify-center text-sm font-bold active:scale-90 transition-all cursor-pointer shadow-2xs"
            title="Close Sidebar (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Section 1: Routine & Execution */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] px-2 block">
              Daily Protocol &amp; Logging
            </span>
            <div className="space-y-1">
              {primaryNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/today" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className={`flex items-start gap-3 p-2.5 rounded-xl transition-all group ${
                      isActive
                        ? "bg-[#a43716] text-white shadow-xs"
                        : "text-[#1f1b14] hover:bg-[#fcf2e6]"
                    }`}
                  >
                    <span className="text-lg shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-[#1f1b14]"}`}>
                          {item.name}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full uppercase ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-[#fcf2e6] text-[#a43716] border border-[#dfc0b7]"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate leading-tight mt-0.5 ${isActive ? "text-white/80" : "text-[#8b716a]"}`}>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section 2: Management & Configuration */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] px-2 block">
              Household &amp; System Hub
            </span>
            <div className="space-y-1">
              {managementNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className={`flex items-start gap-3 p-2.5 rounded-xl transition-all group ${
                      isActive
                        ? "bg-[#a43716] text-white shadow-xs"
                        : "text-[#1f1b14] hover:bg-[#fcf2e6]"
                    }`}
                  >
                    <span className="text-lg shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-bold block truncate ${isActive ? "text-white" : "text-[#1f1b14]"}`}>
                        {item.name}
                      </span>
                      <p className={`text-[11px] truncate leading-tight mt-0.5 ${isActive ? "text-white/80" : "text-[#8b716a]"}`}>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: User status, telemetry & logout */}
        <div className="p-3.5 border-t border-[#dfc0b7] bg-[#fcf2e6]/50 space-y-3 shrink-0">
          {/* Telemetry status pills */}
          <div className="flex items-center justify-between text-[10px] font-mono">
            <div className="flex items-center gap-1.5 text-[#52652a] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#52652a] animate-pulse" />
              <span>DB: PostgreSQL Live</span>
            </div>
            <div className="flex items-center gap-1 text-[#a43716] font-semibold">
              <span>⚡ Keep-Alive Warm</span>
            </div>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#dfc0b7]/60">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#a43716] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                V
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-[#1f1b14] block truncate">Vrund</span>
                <span className="text-[10px] font-mono text-[#8b716a] block">Administrator</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1 rounded-lg border border-[#dfc0b7] bg-white hover:bg-[#ffdad6] hover:text-[#93000a] text-xs font-semibold text-[#58423c] transition-all active:scale-95 shadow-2xs cursor-pointer"
              title="Sign out of Schedulfy"
            >
              Logout ➔
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
