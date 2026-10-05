import { processUserMessage } from "../src/ai/gemini";
import { getAlarmSettings } from "../src/routes/settings";

async function main() {
  console.log("=== Testing AI Alarm Concierge & Clarification Flow ===");

  // 1. Initial Alarm Settings
  const initial = await getAlarmSettings();
  console.log("Current Alarm Sound:", initial.sound);
  console.log("Routines Count:", initial.routines.length);

  // 2. Test AI Clarification when underspecified
  const clarifyResp = await processUserMessage("set alarm", {
    todayDate: "Monday, October 5, 2026",
    timezone: "Asia/Kolkata",
    todayOccurrences: [],
  });
  console.log("Underspecified Prompt Reply:", clarifyResp.reply);
  console.log("Intent:", clarifyResp.action?.intent);
  console.log("Clarification Options:", (clarifyResp.action?.data as any)?.options);

  if (clarifyResp.action?.intent === "ASK_CLARIFICATION" && Array.isArray((clarifyResp.action?.data as any)?.options)) {
    console.log("TEST 1 (AI Clarification Loop with Interactive Options): PASS ✅");
  } else {
    console.error("TEST 1: FAIL ❌");
    process.exit(1);
  }

  // 3. Test AI Direct Alarm Execution
  const configResp = await processUserMessage("set my dinner alarm to 8:30 PM with vitality gong", {
    todayDate: "Monday, October 5, 2026",
    timezone: "Asia/Kolkata",
    todayOccurrences: [],
  });
  console.log("Direct Alarm Reply:", configResp.reply);
  console.log("Intent:", configResp.action?.intent);
  console.log("Action Data:", configResp.action?.data);

  if (configResp.action?.intent === "CONFIGURE_ALARMS") {
    console.log("TEST 2 (AI Full Product Alarm Configuration): PASS ✅");
  } else {
    console.error("TEST 2: FAIL ❌");
    process.exit(1);
  }

  console.log("ALL AI ALARM & CLARIFICATION TESTS PASSED! 🎉");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
