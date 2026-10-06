"use client";

import Link from "next/link";
import { useNavigation } from "@/components/navigation/NavigationProvider";

export default function MobileHeader() {
  const { toggleSidebar } = useNavigation();

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#dfc0b7] px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-2.5">
        {/* Hamburger Menu Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="w-9 h-9 rounded-xl border border-[#dfc0b7] bg-white hover:bg-[#fcf2e6] active:scale-90 text-[#1f1b14] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
          aria-label="Open Navigation Sidebar"
          title="Open Navigation Menu"
        >
          <span className="w-4 h-0.5 bg-[#1f1b14] rounded-full" />
          <span className="w-4 h-0.5 bg-[#1f1b14] rounded-full" />
          <span className="w-4 h-0.5 bg-[#1f1b14] rounded-full" />
        </button>

        {/* Brand identity */}
        <Link href="/today" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-[#ffdbd1] flex items-center justify-center text-[#a43716] font-serif font-bold text-sm border border-[#a43716]/20 shadow-2xs">
            S
          </div>
          <div>
            <span className="text-sm font-serif font-bold text-[#1f1b14] leading-tight block">
              Schedulfy
            </span>
            <span className="text-[9px] font-mono text-[#a43716] font-semibold leading-none block">
              Cockpit
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fcf2e6] border border-[#dfc0b7] text-[10px] font-mono font-semibold text-[#52652a]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#52652a] animate-pulse" />
        <span>Live 🟢</span>
      </div>
    </header>
  );
}
