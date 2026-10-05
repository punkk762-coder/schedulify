"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  type AlarmSoundId,
  startAlarmLoop,
  playSoundOnce,
  ALARM_SOUND_OPTIONS,
} from "@/lib/sound/alarmSynthesizer";

export interface RoutineAlarmItem {
  id: string;
  name: string;
  time: string; // "HH:mm"
  category: "MEAL" | "ACTIVITY" | "HYDRATION" | "OTHER";
  enabled: boolean;
  intervalHours?: number;
}

export interface AlarmSettings {
  sound: AlarmSoundId;
  volume: number;
  leadTimeMin: number;
  browserPushEnabled: boolean;
  routines: RoutineAlarmItem[];
}

export interface ActiveAlarmPayload {
  routineId: string;
  name: string;
  time: string;
  category: string;
}

export function AlarmManager() {
  const [alarmSettings, setAlarmSettings] = useState<AlarmSettings | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarmPayload | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  const [lastTriggeredKey, setLastTriggeredKey] = useState<string | null>(null);

  const loopControllerRef = useRef<{ stop: () => void } | null>(null);
  const snoozeMapRef = useRef<Record<string, number>>({});

  // 1. Fetch Alarm Settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/alarms");
      if (res.ok) {
        const data = await res.json();
        setAlarmSettings(data);
      }
    } catch (err) {
      console.warn("Could not load alarm settings:", err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Request browser notification permissions on mount if enabled
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Stop ringing loop
  const stopAlarm = useCallback(() => {
    if (loopControllerRef.current) {
      loopControllerRef.current.stop();
      loopControllerRef.current = null;
    }
    setIsRinging(false);
    setActiveAlarm(null);
  }, []);

  // Trigger an alarm
  const triggerAlarm = useCallback(
    (routine: ActiveAlarmPayload) => {
      stopAlarm();
      setActiveAlarm(routine);
      setIsRinging(true);

      const sound = alarmSettings?.sound || "zen_bell";
      const volume = alarmSettings?.volume ?? 0.8;

      loopControllerRef.current = startAlarmLoop(sound, volume);

      // Trigger browser notification
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const notif = new Notification(`⏰ Routine Alarm: ${routine.name}`, {
            body: `Scheduled for ${routine.time}. Tap to open protocol checklist.`,
            icon: "/icon.png",
            tag: `alarm-${routine.routineId}`,
            requireInteraction: true,
          });
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        } catch (e) {
          console.warn("Notification error:", e);
        }
      }
    },
    [alarmSettings, stopAlarm]
  );

  // 2. Real-time time checker (runs every 10 seconds)
  useEffect(() => {
    if (!alarmSettings) return;

    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMins = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const todayDateStr = now.toISOString().split("T")[0];

      // Check snoozed alarms
      Object.entries(snoozeMapRef.current).forEach(([id, snoozeUntil]) => {
        if (Date.now() >= snoozeUntil) {
          delete snoozeMapRef.current[id];
          const matched = alarmSettings.routines.find((r) => r.id === id);
          if (matched) {
            triggerAlarm({
              routineId: matched.id,
              name: `${matched.name} (Snoozed)`,
              time: currentTimeStr,
              category: matched.category,
            });
          }
        }
      });

      // Check scheduled routine alarms
      alarmSettings.routines.forEach((routine) => {
        if (!routine.enabled || !routine.time) return;

        // Apply lead time offset if configured
        let targetHours = parseInt(routine.time.split(":")[0], 10);
        let targetMins = parseInt(routine.time.split(":")[1], 10);

        if (alarmSettings.leadTimeMin > 0) {
          let totalMinutes = targetHours * 60 + targetMins - alarmSettings.leadTimeMin;
          if (totalMinutes < 0) totalMinutes += 24 * 60;
          targetHours = Math.floor(totalMinutes / 60);
          targetMins = totalMinutes % 60;
        }

        const scheduledTimeStr = `${String(targetHours).padStart(2, "0")}:${String(targetMins).padStart(2, "0")}`;

        if (scheduledTimeStr === currentTimeStr) {
          const triggerKey = `${todayDateStr}-${routine.id}-${scheduledTimeStr}`;
          if (lastTriggeredKey !== triggerKey && !isRinging) {
            setLastTriggeredKey(triggerKey);
            triggerAlarm({
              routineId: routine.id,
              name: routine.name,
              time: routine.time,
              category: routine.category,
            });
          }
        }
      });
    }, 10000);

    return () => clearInterval(checkInterval);
  }, [alarmSettings, isRinging, lastTriggeredKey, triggerAlarm]);

  // Handle Snooze (5 minutes)
  const handleSnooze = () => {
    if (activeAlarm) {
      snoozeMapRef.current[activeAlarm.routineId] = Date.now() + 5 * 60 * 1000;
    }
    stopAlarm();
  };

  // Handle Mark Done
  const handleMarkDone = async () => {
    try {
      // Find today's occurrence matching activeAlarm category or title
      const todayRes = await fetch("/api/today");
      if (todayRes.ok) {
        const todayData = await todayRes.json();
        const occs = todayData.occurrences || [];
        const match = occs.find(
          (o: any) =>
            o.status === "PENDING" &&
            (o.routineItem?.category?.toLowerCase() === activeAlarm?.category?.toLowerCase() ||
              o.routineItem?.title?.toLowerCase().includes(activeAlarm?.name?.toLowerCase() || ""))
        );

        if (match) {
          await fetch(`/api/occurrences/${match.id}/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: "Completed via Alarm Notification" }),
          });
        }
      }
    } catch (e) {
      console.warn("Could not mark occurrence done:", e);
    }
    stopAlarm();
  };

  // Expose test trigger window event
  useEffect(() => {
    const handleTestTrigger = () => {
      triggerAlarm({
        routineId: "test_alarm",
        name: "Demonstration Routine Alarm",
        time: "Now",
        category: "MEAL",
      });
    };

    window.addEventListener("schedulfy-test-alarm", handleTestTrigger);
    return () => window.removeEventListener("schedulfy-test-alarm", handleTestTrigger);
  }, [triggerAlarm]);

  if (!isRinging || !activeAlarm) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#a43716] shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#a43716]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#52652a]/20 rounded-full blur-2xl pointer-events-none" />

        {/* Ringing Visual */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#ffdbd1] border-2 border-[#a43716] flex items-center justify-center text-3xl shadow-lg animate-bounce">
              ⏰
            </div>
            {/* Pulsing radiating rings */}
            <span className="absolute inset-0 rounded-full border-2 border-[#a43716] animate-ping opacity-40 pointer-events-none" />
            <span className="absolute -inset-2 rounded-full border border-[#a43716] animate-pulse opacity-30 pointer-events-none" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#a43716] animate-ping" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716]">
                Routine Alarm Active
              </span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#1f1b14]">
              {activeAlarm.name}
            </h2>
            <p className="text-xs text-[#58423c] font-medium">
              Scheduled for <strong className="text-[#1f1b14] font-mono">{activeAlarm.time}</strong> • Category:{" "}
              <span className="px-2 py-0.5 rounded-full bg-[#fcf2e6] border border-[#dfc0b7] font-mono font-bold text-[10px] text-[#a43716]">
                {activeAlarm.category}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Complete Button */}
          <button
            type="button"
            onClick={handleMarkDone}
            className="w-full py-3.5 rounded-2xl bg-[#52652a] hover:bg-[#3b4d14] text-white text-xs font-bold transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <span>✓</span>
            <span>Mark Protocol Done &amp; Stop Alarm</span>
          </button>

          {/* Secondary Buttons Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleSnooze}
              className="py-3 rounded-2xl bg-[#fcf2e6] hover:bg-[#fae3cf] text-[#a43716] border border-[#dfc0b7] text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>⏳</span>
              <span>Snooze (5 min)</span>
            </button>

            <button
              type="button"
              onClick={stopAlarm}
              className="py-3 rounded-2xl bg-[#ffdad6] hover:bg-[#ffb5a0] text-[#93000a] border border-[#ba1a1a]/20 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>✕</span>
              <span>Dismiss Alarm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
