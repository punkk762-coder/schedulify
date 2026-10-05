"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Today",
      href: "/today",
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 transition-transform duration-200 ${active ? "text-[#a43716] scale-110" : "text-[#8b716a] group-hover:text-[#1f1b14]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 transition-transform duration-200 ${active ? "text-[#a43716] scale-110" : "text-[#8b716a] group-hover:text-[#1f1b14]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: "History",
      href: "/history",
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 transition-transform duration-200 ${active ? "text-[#a43716] scale-110" : "text-[#8b716a] group-hover:text-[#1f1b14]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: "Coach",
      href: "/chat",
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 transition-transform duration-200 ${active ? "text-[#a43716] scale-110" : "text-[#8b716a] group-hover:text-[#1f1b14]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      name: "Macros",
      href: "/analytics",
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 transition-transform duration-200 ${active ? "text-[#a43716] scale-110" : "text-[#8b716a] group-hover:text-[#1f1b14]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 transition-transform duration-200 ${active ? "text-[#a43716] scale-110" : "text-[#8b716a] group-hover:text-[#1f1b14]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 px-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto bg-white/95 backdrop-blur-2xl border border-[#dfc0b7] rounded-2xl p-1.5 shadow-xl shadow-[#a43716]/10 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`group flex flex-col items-center py-1.5 px-3 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? "bg-[#a43716]/10 text-[#a43716]"
                  : "text-[#8b716a] hover:text-[#1f1b14] hover:bg-[#fff8f2]"
              }`}
            >
              {tab.icon(isActive)}
              <span className={`text-[10px] mt-1 font-medium tracking-tight ${isActive ? "text-[#a43716] font-semibold" : "text-[#8b716a]"}`}>
                {tab.name}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-[#a43716] shadow-sm shadow-[#a43716]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
