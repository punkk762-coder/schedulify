"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DesktopHeader() {
  const pathname = usePathname();

  const navItems = [
    { label: "☀️ Today", href: "/today" },
    { label: "🍲 Hearth", href: "/mom" },
    { label: "💬 AI Coach", href: "/chat" },
    { label: "📊 Analytics", href: "/analytics" },
    { label: "📜 History", href: "/history" },
    { label: "⚙️ Settings", href: "/settings" },
  ];

  return (
    <header className="hidden lg:block sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#dfc0b7] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between gap-4">
        {/* Brand & Node Identity */}
        <Link href="/today" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-[#ffdbd1] flex items-center justify-center text-[#a43716] font-serif font-bold text-lg shadow-2xs border border-[#a43716]/20 group-hover:scale-105 transition-transform">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-lg tracking-tight text-[#1f1b14]">
                Schedulfy
              </span>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#fcf2e6] text-[#a43716] border border-[#dfc0b7]">
                Cockpit
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop View Switcher Tabs (Never wrap, perfect horizontal pills) */}
        <nav className="flex items-center gap-1 bg-[#fcf2e6] p-1 rounded-full border border-[#dfc0b7] shrink-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-white text-[#1f1b14] shadow-2xs"
                    : "text-[#58423c] hover:text-[#1f1b14]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Trailing Status Cluster: Hearth Sync + Timezone */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fcf2e6] border border-[#dfc0b7] text-xs text-[#58423c] font-medium whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse"></span>
            <span>Hearth: <strong className="text-[#1f1b14]">Linked</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4eca2] text-[#3b4d14] border border-[#52652a]/30 text-xs font-semibold whitespace-nowrap font-mono">
            <span>IST • Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
