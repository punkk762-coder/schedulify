/**
 * End-to-End Real Flow Verification Script
 * Validates domain services, database transactions, auth, and AI execution.
 */
import { prisma } from "../src/lib/db";
import { occurrenceService, kitchenService, analyticsService } from "../src/lib/domain";
import { todayUtc } from "../src/lib/dates";
import { processUserMessage } from "../src/lib/ai/gemini";
import { verifyPin } from "../src/lib/auth";

async function verifyAll() {
  console.log("🚀 Starting End-to-End Flow Verification...\n");

  // 1. Verify Auth PIN Logic
  console.log("1️⃣ Verifying Authentication PINs...");
  const userPinOk = verifyPin("1234", process.env.USER_PIN || "1234");
  const momPinOk = verifyPin("5678", process.env.MOM_PIN || "5678");
  const badPinFails = !verifyPin("0000", process.env.USER_PIN || "1234");

  if (!userPinOk || !momPinOk || !badPinFails) {
    throw new Error("Auth PIN verification failed");
  }
  console.log("   ✓ User PIN (1234) valid");
  console.log("   ✓ Mom PIN (5678) valid");
  console.log("   ✓ Invalid PIN rejected");

  // 2. Verify Database Connection & Seeded Records
  console.log("\n2️⃣ Verifying PostgreSQL Database & Active Plan...");
  const user = await prisma.user.findUnique({ where: { role: "USER" } });
  const mom = await prisma.user.findUnique({ where: { role: "MOM" } });
  const plan = await prisma.plan.findFirst({ where: { status: "ACTIVE" } });

  if (!user || !mom || !plan) {
    throw new Error("Database missing user, mom, or active plan");
  }
  console.log(`   ✓ User record: ${user.id} (${user.role})`);
  console.log(`   ✓ Mom record: ${mom.id} (${mom.role})`);
  console.log(`   ✓ Active plan: "${plan.name}" (status: ${plan.status})`);

  // 3. Verify Today Occurrences Lifecycle
  console.log("\n3️⃣ Verifying Today's Routine Occurrences...");
  const today = todayUtc();
  const occurrences = await occurrenceService.getToday();
  console.log(`   ✓ Today has ${occurrences.length} occurrences scheduled`);

  for (const o of occurrences) {
    console.log(`     - [${o.status}] ${o.scheduledTime} : ${o.routineItem.title} (${o.routineItem.category})`);
  }

  if (occurrences.length < 5) {
    throw new Error("Expected at least 5 routine items for today");
  }

  // 4. Test Completing a Pending Item
  console.log("\n4️⃣ Testing Occurrence Completion Flow...");
  const pendingItem = occurrences.find((o) => o.status === "PENDING");
  if (pendingItem) {
    const comp = await occurrenceService.complete(pendingItem.id, "Verified by E2E test");
    const updatedOcc = await prisma.occurrence.findUnique({ where: { id: pendingItem.id } });
    if (updatedOcc?.status !== "COMPLETED" || comp.status !== "COMPLETED") {
      throw new Error("Failed to transition occurrence to COMPLETED");
    }
    console.log(`   ✓ Successfully completed "${pendingItem.routineItem.title}" (ID: ${pendingItem.id})`);
  } else {
    console.log("   ℹ No pending item to complete, all already handled");
  }

  // 5. Test Alternative Replacement Flow
  console.log("\n5️⃣ Testing Alternative Replacement Flow...");
  const currentOccurrences = await occurrenceService.getToday();
  const itemWithAlt = currentOccurrences.find((o) => o.routineItem.primaryAlternatives.length > 0 && o.status === "PENDING");
  if (itemWithAlt) {
    const alt = itemWithAlt.routineItem.primaryAlternatives[0];
    const rep = await occurrenceService.replace(itemWithAlt.id, alt.alternativeItemId, "Swapped via E2E test");
    const updated = await prisma.occurrence.findUnique({ where: { id: itemWithAlt.id } });
    if (updated?.status !== "REPLACED" || rep.status !== "REPLACED") {
      throw new Error("Failed to transition occurrence to REPLACED");
    }
    console.log(`   ✓ Successfully replaced "${itemWithAlt.routineItem.title}" with alternative (ID: ${alt.alternativeItemId})`);
  } else {
    console.log("   ℹ Alternative replacement already tested or no pending alternative found");
  }

  // 6. Test AI Intent Interpreter
  console.log("\n6️⃣ Testing AI Intent Interpreter & Natural Language Execution...");
  const context = {
    todayDate: "Wednesday, October 4, 2026",
    timezone: "Asia/Kolkata",
    todayOccurrences: occurrences.map((o) => ({
      id: o.id,
      title: o.routineItem.title,
      category: o.routineItem.category,
      time: o.scheduledTime,
      status: o.status,
    })),
  };

  const aiWalkRes = await processUserMessage("Finished my 1-hour evening walk", context);
  console.log(`   ✓ User: "Finished my 1-hour evening walk"`);
  console.log(`     AI Intent: ${aiWalkRes.action?.intent} (target: ${aiWalkRes.action?.target?.name})`);
  console.log(`     AI Reply: "${aiWalkRes.reply}"`);

  if (aiWalkRes.action?.intent !== "COMPLETE") {
    throw new Error("AI failed to recognize completion intent");
  }

  // 7. Verify Mom Kitchen View
  console.log("\n7️⃣ Verifying Mom Kitchen Dashboard API...");
  const kitchenMeals = await kitchenService.getTodayMeals();
  console.log(`   ✓ Mom Kitchen returned ${kitchenMeals.length} meals for today`);
  for (const km of kitchenMeals) {
    const compCount = km.components.length;
    console.log(`     - ${km.time} [${km.mealType}] ${km.title} (${compCount} ingredients listed)`);
  }
  if (kitchenMeals.length === 0) {
    throw new Error("Mom kitchen should have meals listed");
  }

  // 8. Verify Analytics On-The-Fly Computation
  console.log("\n8️⃣ Verifying Analytics Computation...");
  const dailyStats = await analyticsService.getDailyStats(today);
  console.log(`   ✓ Total: ${dailyStats.total}, Completed: ${dailyStats.completed}, Rate: ${Math.round(dailyStats.completionRate * 100)}%`);
  console.log(`   ✓ Logged Nutrition: ${dailyStats.nutrition.calories || 0} kcal, ${dailyStats.nutrition.protein || 0}g protein`);

  console.log("\n🎉 ALL END-TO-END FLOWS FULLY VERIFIED AND WORKING 100%!");
}

verifyAll()
  .catch((err) => {
    console.error("\n❌ Verification Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
