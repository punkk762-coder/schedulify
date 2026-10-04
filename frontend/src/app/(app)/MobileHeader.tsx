"use client";

import Link from "next/link";

export default function MobileHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#dfc0b7] px-4 py-2.5 flex items-center justify-between shadow-2xs">
      <Link href="/today" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-xl bg-[#ffdbd1] flex items-center justify-center text-[#a43716] font-serif font-bold text-base border border-[#a43716]/20 shadow-2xs">
          S
        </div>
        <div>
          <span className="text-[9px] font-mono font-bold uppercase text-[#a43716] tracking-wider block">
            Schedulfy OS
          </span>
          <span className="text-sm font-serif font-bold text-[#1f1b14] leading-tight block">
            Routine Studio
          </span>
        </div>
      </Link>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fcf2e6] border border-[#dfc0b7] text-[10px] font-mono font-semibold text-[#52652a]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#52652a] animate-pulse"></span>
        <span>Live Synced 🟢</span>
      </div>
    </header>
  );
}
