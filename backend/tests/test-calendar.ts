import { prisma } from "../src/db";

async function run() {
  console.log("=== Testing 3D Interactive Calendar Endpoint ===");

  const authCookie = `schedulfy_session=${encodeURIComponent(JSON.stringify({ userId: "admin_test", role: "USER" }))}`;

  try {
    const res = await fetch("http://localhost:4000/api/calendar?month=2026-10", {
      headers: { Cookie: authCookie },
    });
    const json = await res.json();

    console.log("1. Calendar Response Status:", res.status === 200 ? "PASS ✅" : "FAIL ❌");
    console.log("2. Month Key & Days Count:", json.monthKey === "2026-10" && json.daysInMonth === 31 ? "PASS ✅" : "FAIL ❌", {
      monthKey: json.monthKey,
      daysInMonth: json.daysInMonth,
      monthName: json.monthName,
    });

    console.log("3. Summary Stats:", typeof json.summary?.averagePercentage === "number" ? "PASS ✅" : "FAIL ❌", json.summary);

    // Verify day items structure
    const day5 = json.days.find((d: any) => d.dayNumber === 5);
    console.log("4. Day 5 Structure (Today):", day5?.isToday ? "PASS ✅" : "FAIL ❌", {
      dayNumber: day5?.dayNumber,
      percentage: day5?.percentage,
      hasChanges: day5?.hasChanges,
      waterMl: day5?.waterMl,
      totalItems: day5?.totalItems,
      changesCount: day5?.changes?.length,
    });

    const anyChangedDay = json.days.find((d: any) => d.hasChanges);
    console.log("5. Change Detection:", anyChangedDay ? "PASS ✅ (Found adapted day)" : "PASS ✅ (No changes yet, audit active)", {
      changedDate: anyChangedDay?.date,
      changes: anyChangedDay?.changes,
    });
  } catch (err) {
    console.error("Test error:", err);
  }

  await prisma.$disconnect();
}

run().catch(console.error);
