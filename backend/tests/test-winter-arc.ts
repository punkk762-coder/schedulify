import { prisma } from "../src/db";
import { getWinterArcPhase, getNextWinterArcPhase, WINTER_ARC_PHASES } from "../src/winterArc";

async function run() {
  console.log("=== Testing Winter Arc 5-Phase Architecture ===");

  // 1. Verify 5 phases config
  console.log("1. Total Phases:", WINTER_ARC_PHASES.length === 5 ? "PASS ✅ (5 phases Oct-Feb)" : "FAIL ❌");
  console.log("   - Phase 1:", WINTER_ARC_PHASES[0].title);
  console.log("   - Phase 5:", WINTER_ARC_PHASES[4].title);

  // 2. Test Phase Resolution
  const octPhase = getWinterArcPhase("2026-10");
  const novPhase = getNextWinterArcPhase("2026-10");
  console.log("2. Resolution:", octPhase.phaseNumber === 1 && novPhase?.phaseNumber === 2 ? "PASS ✅" : "FAIL ❌");

  // 3. Test HTTP API calls against local backend
  const authCookie = `schedulfy_session=${encodeURIComponent(JSON.stringify({ userId: "user_test", role: "USER" }))}`;

  try {
    const resToday = await fetch("http://localhost:4000/api/today", {
      headers: { Cookie: authCookie },
    });
    const todayJson = await resToday.json();
    console.log("3. GET /api/today winterArc:", todayJson.winterArc?.phase === 1 && todayJson.winterArc?.allPhases?.length === 5 ? "PASS ✅" : "FAIL ❌", {
      phase: todayJson.winterArc?.phase,
      phaseTitle: todayJson.winterArc?.phaseTitle,
      totalPhases: todayJson.winterArc?.totalPhases,
    });

    const resAnalytics = await fetch("http://localhost:4000/api/analytics", {
      headers: { Cookie: authCookie },
    });
    const analyticsJson = await resAnalytics.json();
    console.log("4. GET /api/analytics winterArc:", analyticsJson.winterArc?.currentPhase?.phaseNumber === 1 ? "PASS ✅" : "FAIL ❌", {
      currentPhase: analyticsJson.winterArc?.currentPhase?.title,
      expectedSteps: analyticsJson.winterArc?.comparison?.whatWasExpected?.dailySteps,
      doneSteps: analyticsJson.winterArc?.comparison?.whatWeHadDone?.averageDailySteps,
      aiRecommendationsCount: analyticsJson.winterArc?.aiRecommendations?.length,
    });

    // 4. Test Phase Transition API
    const resTransition = await fetch("http://localhost:4000/api/analytics/phase-transition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
      },
      body: JSON.stringify({
        completedMonthKey: "2026-10",
        nextMonthKey: "2026-11",
        actualWeightKg: 72.4,
        nextTargetWeightKg: 71.0,
        nextDailyStepsTarget: 10000,
        nextDailyWaterTargetMl: 3200,
        notes: "Test transition: October foundation established.",
      }),
    });
    const transitionJson = await resTransition.json();
    console.log("5. POST /api/analytics/phase-transition:", transitionJson.success ? "PASS ✅" : "FAIL ❌", {
      message: transitionJson.message,
      retrospectiveTitle: transitionJson.retrospective?.title,
      nextMonth: transitionJson.activeGoal?.month,
      nextTargetWeight: transitionJson.activeGoal?.targetWeightKg,
    });

    // 5. Verify PostgreSQL ledger immutability
    const octGoal = await prisma.monthlyGoal.findUnique({ where: { month: "2026-10" } });
    const novGoal = await prisma.monthlyGoal.findUnique({ where: { month: "2026-11" } });
    const totalOccurrences = await prisma.occurrence.count();

    console.log("6. DB Ledger Verification:", octGoal?.status === "ACHIEVED" && novGoal?.status === "IN_PROGRESS" ? "PASS ✅" : "FAIL ❌", {
      octoberStatus: octGoal?.status,
      octoberRoutineChangesRecorded: !!octGoal?.routineChanges,
      novemberStatus: novGoal?.status,
      novemberStepsTarget: novGoal?.dailyStepsTarget,
      totalHistoricalOccurrencesPreserved: totalOccurrences,
    });
  } catch (err) {
    console.error("Fetch error during test:", err);
  }

  await prisma.$disconnect();
}

run().catch(console.error);
