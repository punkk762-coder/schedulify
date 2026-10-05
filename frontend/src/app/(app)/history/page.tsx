"use client";

import { useState, useEffect } from "react";
import { HistoryDesktopView } from "@/components/history/HistoryDesktopView";
import { HistoryMobileView } from "@/components/history/HistoryMobileView";

interface OccurrenceRecord {
  id: string;
  scheduledTime: string;
  status: string;
  routineItem: {
    title: string;
    category: string;
  };
  completion?: {
    notes?: string;
  };
}

export default function HistoryPage() {
  const [range, setRange] = useState<"today" | "yesterday" | "week" | "month">("week");
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState<Record<string, OccurrenceRecord[]>>({});

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/history?range=${range}`);
        if (res.ok) {
          const json = await res.json();
          if (!ignore) {
            setGrouped(json.grouped || {});
          }
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [range]);

  if (loading && Object.keys(grouped).length === 0) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="h-28 rounded-2xl animate-pulse bg-white/70 border border-[#dfc0b7]" />
        <div className="h-44 rounded-2xl animate-pulse bg-white/70 border border-[#dfc0b7]" />
      </div>
    );
  }

  return (
    <div className="w-full text-[#1f1b14]">
      {/* Desktop Clean Executive View (lg+) */}
      <div className="hidden lg:block">
        <HistoryDesktopView
          range={range}
          onSelectRange={setRange}
          grouped={grouped}
        />
      </div>

      {/* Mobile Magnificent Logbook View (< lg) */}
      <div className="block lg:hidden">
        <HistoryMobileView
          range={range}
          onSelectRange={setRange}
          grouped={grouped}
        />
      </div>
    </div>
  );
}
