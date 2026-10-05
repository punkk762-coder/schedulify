import {
  getGeminiUsageStats,
  recordGeminiUsage,
  getActiveGeminiKey,
  testGeminiApiKey,
} from "../src/ai/geminiQuota";

async function main() {
  console.log("=== Testing Gemini Quota & Key Management ===");

  // 1. Get active key config
  const active = await getActiveGeminiKey();
  console.log("Active Key Source:", active.source);
  console.log("Masked Key:", active.maskedKey);

  // 2. Initial stats
  const initialStats = await getGeminiUsageStats();
  console.log("Initial Stats:", {
    dailyRequestLimit: initialStats.dailyRequestLimit,
    requestsToday: initialStats.requestsToday,
    remainingRequests: initialStats.remainingRequests,
    totalTokensToday: initialStats.totalTokensToday,
    quotaStatus: initialStats.quotaStatus,
  });

  // 3. Record synthetic usage
  await recordGeminiUsage({ prompt: 150, candidate: 75, total: 225 });
  const updatedStats = await getGeminiUsageStats();
  console.log("Updated Stats (+225 tokens, +1 req):", {
    requestsToday: updatedStats.requestsToday,
    remainingRequests: updatedStats.remainingRequests,
    totalTokensToday: updatedStats.totalTokensToday,
    quotaStatus: updatedStats.quotaStatus,
  });

  if (updatedStats.requestsToday >= initialStats.requestsToday + 1 && updatedStats.totalTokensToday >= initialStats.totalTokensToday + 225) {
    console.log("TEST 1 (Record Usage & Token Tracking): PASS ✅");
  } else {
    console.error("TEST 1: FAIL ❌");
    process.exit(1);
  }

  // 4. Test blank key validation
  const blankTest = await testGeminiApiKey("");
  if (!blankTest.valid) {
    console.log("TEST 2 (Reject Blank Key): PASS ✅");
  } else {
    console.error("TEST 2: FAIL ❌");
    process.exit(1);
  }

  console.log("ALL GEMINI QUOTA TESTS PASSED! 🎉");
}

main().catch((err) => {
  console.error("Test failed with exception:", err);
  process.exit(1);
});
