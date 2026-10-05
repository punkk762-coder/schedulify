"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RoutineItemConfig {
  id: string;
  title: string;
  category: "MEAL" | "WORKOUT" | "SUPPLEMENT" | "ACTIVITY" | "HYDRATION" | "OTHER";
  scheduledTime: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: "BREAKFAST" | "LUNCH" | "SNACK" | "DINNER" | "PRE_WORKOUT" | "POST_WORKOUT" | "OTHER";
}

const DEFAULT_ROUTINE_ITEMS: RoutineItemConfig[] = [
  {
    id: "item-1",
    title: "Chocolate Proats",
    category: "MEAL",
    scheduledTime: "10:15",
    calories: 450,
    protein: 25,
    carbs: 55,
    fat: 10,
    mealType: "BREAKFAST",
  },
  {
    id: "item-2",
    title: "2 Phulkas + Paneer/Dal",
    category: "MEAL",
    scheduledTime: "12:30",
    calories: 500,
    protein: 24,
    carbs: 65,
    fat: 12,
    mealType: "LUNCH",
  },
  {
    id: "item-3",
    title: "Kala Chana / Roasted Makhana",
    category: "MEAL",
    scheduledTime: "17:30",
    calories: 200,
    protein: 10,
    carbs: 30,
    fat: 4,
    mealType: "SNACK",
  },
  {
    id: "item-4",
    title: "Paneer Bhurji with 2 Phulkas",
    category: "MEAL",
    scheduledTime: "19:00",
    calories: 450,
    protein: 22,
    carbs: 40,
    fat: 16,
    mealType: "DINNER",
  },
  {
    id: "item-5",
    title: "Evening Conditioning Walk (45 mins)",
    category: "WORKOUT",
    scheduledTime: "20:00",
    calories: 220,
    protein: 0,
    carbs: 0,
    fat: 0,
    mealType: "OTHER",
  },
  {
    id: "item-6",
    title: "Cellular Hydration Protocol (3L Target)",
    category: "HYDRATION",
    scheduledTime: "08:00",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    mealType: "OTHER",
  },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: User Profile
  const [name, setName] = useState("Vrund");
  const [currentWeight, setCurrentWeight] = useState<number>(74);
  const [targetWeight, setTargetWeight] = useState<number>(70);

  // Step 2: Phase 1 Configuration
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [phaseName, setPhaseName] = useState("Phase 1: Winter Arc");
  const [phaseSubtitle, setPhaseSubtitle] = useState("Lean Hypertrophy & Discipline");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(defaultEndDate);

  // Step 3: Targets & Calorie Plan (Default 1600 kcal)
  const [dailyCalories, setDailyCalories] = useState<number>(1600);
  const [proteinTarget, setProteinTarget] = useState<number>(140);
  const [dailySteps, setDailySteps] = useState<number>(8000);
  const [dailyWaterMl, setDailyWaterMl] = useState<number>(3000);
  const [planSource, setPlanSource] = useState<"DEFAULT" | "GEMINI_JSON">("GEMINI_JSON");
  const [geminiJsonText, setGeminiJsonText] = useState("");
  const [jsonParseSuccess, setJsonParseSuccess] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  // Step 3: Zero-Typing Interactive Questionnaire State (Click Only)
  const [dietPreference, setDietPreference] = useState<"VEG" | "EGGETARIAN" | "NON_VEG" | "VEGAN">("VEG");
  const [primaryGoal, setPrimaryGoal] = useState<"FAT_LOSS" | "RECOMP" | "HYPERTROPHY">("FAT_LOSS");
  const [mealCount, setMealCount] = useState<number>(4);
  const [workoutTiming, setWorkoutTiming] = useState<"MORNING" | "EVENING" | "NIGHT" | "WALK_ONLY">("EVENING");

  const scrollToNextQuestion = (nextElementId: string) => {
    setTimeout(() => {
      const el = document.getElementById(nextElementId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  };

  // Step 4: Daily Routine Blueprint
  const [routineItems, setRoutineItems] = useState<RoutineItemConfig[]>(DEFAULT_ROUTINE_ITEMS);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Load any existing defaults
  useEffect(() => {
    async function loadDefaults() {
      try {
        const res = await fetch("/api/setup/status");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.name) setName(data.user.name);
          if (data.user?.currentWeightKg) setCurrentWeight(data.user.currentWeightKg);
          if (data.user?.targetWeightKg) setTargetWeight(data.user.targetWeightKg);
          if (data.phase?.name) setPhaseName(data.phase.name);
          if (data.phase?.subtitle) setPhaseSubtitle(data.phase.subtitle);
          if (data.phase?.startDate) setStartDate(data.phase.startDate);
          if (data.phase?.endDate) setEndDate(data.phase.endDate);
          if (data.phase?.targetCalories) setDailyCalories(data.phase.targetCalories);
          if (data.phase?.dailyStepsTarget) setDailySteps(data.phase.dailyStepsTarget);
          if (data.phase?.dailyWaterTargetMl) setDailyWaterMl(data.phase.dailyWaterTargetMl);
        }
      } catch (err) {
        console.warn("Could not load initial setup status:", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadDefaults();
  }, []);

  // Compute remaining days in phase
  const targetEndMs = new Date(`${endDate}T23:59:59Z`).getTime();
  const targetStartMs = new Date(`${startDate}T00:00:00Z`).getTime();
  const totalPhaseDays = Math.max(1, Math.ceil((targetEndMs - targetStartMs) / (1000 * 60 * 60 * 24)));

  // Total calories in blueprint
  const totalBlueprintCalories = routineItems.reduce((acc, it) => acc + (it.calories || 0), 0);
  const totalBlueprintProtein = routineItems.reduce((acc, it) => acc + (it.protein || 0), 0);

  // Dynamic labels for Master Prompt
  const dietLabel =
    dietPreference === "VEG"
      ? "Vegetarian (Paneer, Dal, Tofu, Legumes, Greek Yogurt, Milk, Nuts, Seeds)"
      : dietPreference === "EGGETARIAN"
      ? "Eggetarian (Whole Eggs, Egg Whites, Paneer, Dal, Greek Yogurt, Oats)"
      : dietPreference === "NON_VEG"
      ? "Non-Vegetarian (Chicken Breast, Eggs, Fish, Paneer, Dal, Rice)"
      : "100% Plant-Based Vegan (Tofu, Soya Chunks, Lentils, Chickpeas, Peanut Butter, Seeds)";

  const goalLabel =
    primaryGoal === "FAT_LOSS"
      ? "Aggressive Fat Loss & Lean Definition (Caloric Deficit Protocol)"
      : primaryGoal === "RECOMP"
      ? "Body Recomposition (Simultaneous Fat Loss & Muscle Retention)"
      : "Lean Hypertrophy (Clean Muscle Gain with Controlled Caloric Balance)";

  const workoutLabel =
    workoutTiming === "MORNING"
      ? "Morning Session (07:00 AM) + Daily Conditioning Walk"
      : workoutTiming === "EVENING"
      ? "Evening Session (06:00 PM - 07:30 PM) + Evening Walk"
      : workoutTiming === "NIGHT"
      ? "Night Session (08:30 PM) + Sleep Preparation"
      : "Dedicated Daily Conditioning Walks (No Heavy Gym)";

  // Engineered Gemini-Only Zero-Token Master Prompt
  const geminiPromptTemplate = `Act as an elite sports dietitian and routine architect for Schedulfy.
Create a complete, realistic daily routine and diet plan tailored strictly for:
- User Name: ${name}
- Current Weight: ${currentWeight} kg | Target Goal Weight: ${targetWeight} kg
- Protocol Objective: ${goalLabel}
- Dietary Preference: ${dietLabel}
- Daily Caloric Intake: Exactly ${dailyCalories} kcal (±30 kcal)
- Daily Protein Intake: Minimum ${proteinTarget}g Protein
- Daily Hydration Target: ${dailyWaterMl} ml
- Daily Steps Target: ${dailySteps} steps
- Daily Meals Count: Exactly ${mealCount} scheduled meals/snacks
- Workout Schedule: ${workoutLabel}

CRITICAL INSTRUCTIONS FOR GEMINI (STRICT COMPLIANCE REQUIRED):
1. Output ONLY a raw valid JSON array. Do not write introductory words, conversational filler, markdown formatting explanations, or conclusion notes outside the JSON array.
2. Every item in the JSON array must follow this exact schema:
[
  {
    "title": "Exact Food or Routine Item Name (e.g. '2 Phulkas + Paneer Bhurji & Dal')",
    "category": "MEAL" or "WORKOUT" or "HYDRATION",
    "scheduledTime": "HH:mm", // 24-hour time format e.g. "10:15", "12:30", "17:30", "19:00", "20:00"
    "calories": number, // Calories for this item
    "protein": number, // Protein in grams
    "carbs": number, // Carbohydrates in grams
    "fat": number, // Fat in grams
    "mealType": "BREAKFAST" or "LUNCH" or "SNACK" or "DINNER" or "OTHER"
  }
]
3. The sum of all meal calories must equal approximately ${dailyCalories} kcal, and total protein must be >= ${proteinTarget}g.
4. Use delicious, authentic, easily cookable foods matching ${dietLabel}.
5. Avoid generic titles like 'Meal 1' or 'Healthy Snack'. Specify exact portion sizes and foods.`;

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(geminiPromptTemplate);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 3000);
  };

  const handleParseGeminiJson = () => {
    try {
      setErrorMessage(null);
      let text = geminiJsonText.trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```[a-z]*\s*/i, "").replace(/```$/, "").trim();
      }
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("JSON must be a non-empty array of routine items.");
      }

      const validated: RoutineItemConfig[] = parsed.map((item, idx) => ({
        id: `gemini-item-${idx + 1}`,
        title: String(item.title || `Routine Item ${idx + 1}`),
        category: (["MEAL", "WORKOUT", "SUPPLEMENT", "ACTIVITY", "HYDRATION"].includes(item.category)
          ? item.category
          : "MEAL") as RoutineItemConfig["category"],
        scheduledTime: item.scheduledTime || "12:00",
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
        mealType: (["BREAKFAST", "LUNCH", "SNACK", "DINNER", "PRE_WORKOUT", "POST_WORKOUT"].includes(item.mealType)
          ? item.mealType
          : "OTHER") as RoutineItemConfig["mealType"],
      }));

      setRoutineItems(validated);
      const totalCal = validated.reduce((a, b) => a + b.calories, 0);
      setDailyCalories(totalCal > 0 ? totalCal : 1600);
      setJsonParseSuccess(`✓ Successfully imported ${validated.length} items totaling ${totalCal} kcal!`);
      setTimeout(() => setJsonParseSuccess(null), 4000);
    } catch (err: any) {
      setErrorMessage(`Invalid JSON format: ${err.message || "Please check your JSON structure."}`);
    }
  };

  const handleCompleteSetup = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        name,
        currentWeightKg: currentWeight,
        targetWeightKg: targetWeight,
        phaseName,
        phaseSubtitle,
        startDate,
        endDate,
        dailyCalories,
        proteinTarget,
        dailySteps,
        dailyWaterMl,
        routineItems,
      };

      const res = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to commit routine setup");
      }

      router.push("/today");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while saving setup.");
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#a43716] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#8b716a]">Initializing Onboarding Protocol...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4 text-[#1f1b14] space-y-6">
      {/* ─── Header & Progress Stepper ─── */}
      <div className="bg-white rounded-3xl p-6 border border-[#dfc0b7] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dfc0b7]/60 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#52652a]">
                New Protocol Setup Wizard
              </span>
              <span className="text-[10px] font-mono text-[#8b716a]">• Zero-AI-Token Setup</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1f1b14]">
              Configure Your Routine OS
            </h1>
            <p className="text-xs text-[#58423c] mt-0.5">
              Personalize your Phase 1 timeline, body targets, 1,600 kcal diet protocol, and daily schedule.
            </p>
          </div>

          <Link
            href="/today"
            className="text-xs font-mono font-semibold text-[#8b716a] hover:text-[#1f1b14] px-3 py-1.5 rounded-xl border border-[#dfc0b7] hover:bg-[#fcf2e6]/50 transition-colors self-start sm:self-auto"
          >
            Skip to Today →
          </Link>
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-5 gap-2 pt-4">
          {[
            { num: 1, label: "Overview & Profile" },
            { num: 2, label: "Phase 1 Dates" },
            { num: 3, label: "Diet & Standards" },
            { num: 4, label: "Daily Blueprint" },
            { num: 5, label: "Launch OS" },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={`p-2 rounded-xl text-left border transition-all ${
                step === s.num
                  ? "bg-[#a43716] text-white border-[#a43716] shadow-xs"
                  : step > s.num
                  ? "bg-[#d4eca2]/40 text-[#3b4d14] border-[#d4eca2]"
                  : "bg-[#fcf2e6]/40 text-[#8b716a] border-[#dfc0b7]/60 hover:bg-[#fcf2e6]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-mono font-bold rounded-full w-4 h-4 flex items-center justify-center ${
                  step === s.num ? "bg-white text-[#a43716]" : step > s.num ? "bg-[#52652a] text-white" : "bg-black/10"
                }`}>
                  {step > s.num ? "✓" : s.num}
                </span>
                <span className="text-[11px] font-bold truncate hidden sm:inline">{s.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#ffdad6] border border-[#ba1a1a]/40 text-[#ba1a1a] text-xs font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ─── STEP 1: Product Architecture & User Identity ─── */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 border border-[#dfc0b7] shadow-xs space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716]">
                Step 1 • System Architecture Tour
              </span>
              <h2 className="text-xl font-serif font-bold text-[#1f1b14] mt-0.5">
                How Schedulfy Powers Your Day
              </h2>
              <p className="text-xs text-[#58423c]">
                Schedulfy is your high-density personal routine operating system designed for zero-friction discipline.
              </p>
            </div>

            {/* 4 Architecture Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h4 className="text-sm font-bold text-[#1f1b14]">Today Cockpit</h4>
                </div>
                <p className="text-xs text-[#58423c] leading-relaxed">
                  Focus Order queue, 1-click &quot;Mark Done&quot;, real-time macro ledger, and off-plan food deviation logs.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍲</span>
                  <h4 className="text-sm font-bold text-[#1f1b14]">Mom&apos;s Kitchen Handshake</h4>
                </div>
                <p className="text-xs text-[#58423c] leading-relaxed">
                  Dedicated Mom&apos;s deck with live meal prep updates (&quot;Mom Prepping&quot;), ingredient notes, and substitute requests.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌊</span>
                  <h4 className="text-sm font-bold text-[#1f1b14]">3D Discipline Calendar</h4>
                </div>
                <p className="text-xs text-[#58423c] leading-relaxed">
                  Fluid water wave indicator: Blue water for 100% on-plan days, Red water when off-plan food or swaps occur.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <h4 className="text-sm font-bold text-[#1f1b14]">Telemetry &amp; Audit Ledger</h4>
                </div>
                <p className="text-xs text-[#58423c] leading-relaxed">
                  Caloric breakdown (Planned vs Off-Plan vs Total) and comprehensive ledger of every differing meal.
                </p>
              </div>
            </div>

            {/* User Identity Form */}
            <div className="pt-4 border-t border-[#dfc0b7]/60 space-y-4">
              <h3 className="text-base font-serif font-bold text-[#1f1b14]">
                Your Biometric Baseline
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-mono font-bold text-[#8b716a] block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vrund"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc0b7] bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#a43716]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-[#8b716a] block mb-1">
                    Current Weight (kg)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc0b7] bg-white text-sm font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#a43716]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#8b716a] font-mono">kg</span>
                  </div>
                  <span className="text-[10px] text-[#58423c] mt-0.5 block">Stored as default 1-click weight</span>
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-[#8b716a] block mb-1">
                    Target Goal Weight (kg)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc0b7] bg-white text-sm font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#a43716]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#8b716a] font-mono">kg</span>
                  </div>
                  <span className="text-[10px] text-[#58423c] mt-0.5 block">Phase 1 milestone metric</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-[#a43716] text-white font-bold text-xs shadow-xs hover:bg-[#8e2e12] transition-all"
              >
                Proceed to Phase 1 Setup →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Phase 1 & Completion Date ─── */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 border border-[#dfc0b7] shadow-xs space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716]">
                Step 2 • Single Active Phase Setup
              </span>
              <h2 className="text-xl font-serif font-bold text-[#1f1b14] mt-0.5">
                Set Phase 1 &amp; Completion Target Date
              </h2>
              <p className="text-xs text-[#58423c]">
                Per your protocol principles, only your active phase is displayed on Home. Configure its title and finish date.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono font-bold text-[#8b716a] block mb-1">
                  Phase Title
                </label>
                <input
                  type="text"
                  value={phaseName}
                  onChange={(e) => setPhaseName(e.target.value)}
                  placeholder="Phase 1: Winter Arc"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc0b7] bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#a43716]"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-[#8b716a] block mb-1">
                  Focus / Subtitle
                </label>
                <input
                  type="text"
                  value={phaseSubtitle}
                  onChange={(e) => setPhaseSubtitle(e.target.value)}
                  placeholder="Lean Hypertrophy & Discipline"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc0b7] bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#a43716]"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-[#8b716a] block mb-1">
                  Phase Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc0b7] bg-white text-sm font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#a43716]"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-[#8b716a] block mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc0b7] bg-white text-sm font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#a43716]"
                />
              </div>
            </div>

            {/* Dynamic Phase Duration Banner */}
            <div className="p-4 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#a43716] block">
                  Calculated Commitment Window
                </span>
                <span className="text-lg font-serif font-bold text-[#1f1b14]">
                  {totalPhaseDays} Days Execution Cycle
                </span>
                <p className="text-[11px] text-[#58423c]">
                  Runs from {startDate} through {endDate}.
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-serif font-bold text-[#52652a]">
                  {(currentWeight - targetWeight).toFixed(1)} kg
                </span>
                <span className="text-[10px] font-mono text-[#8b716a] block">Target Delta</span>
              </div>
            </div>

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2 rounded-xl border border-[#dfc0b7] text-[#58423c] font-bold text-xs hover:bg-[#fcf2e6]"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-[#a43716] text-white font-bold text-xs shadow-xs hover:bg-[#8e2e12] transition-all"
              >
                Proceed to Diet &amp; Standards →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Interactive Zero-Typing Questionnaire & Gemini Blueprint ─── */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dfc0b7] shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#a43716] animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716]">
                  Step 3 • Protocol Standards &amp; AI Meal Architect
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1f1b14]">
                Configure Your Diet &amp; Generate Blueprint
              </h2>
              <p className="text-xs text-[#58423c] mt-0.5">
                Select your preferences below (no manual typing needed). The system will automatically construct an engineered prompt for Google Gemini to synthesize your exact daily routine.
              </p>
            </div>

            {/* ─── Unified Hardcoded Questionnaire (Tap options, auto-scrolls) ─── */}
            <div className="space-y-5">
              {/* Question 1: Dietary Preference */}
              <div id="q-diet" className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7] space-y-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1f1b14] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#a43716] text-white flex items-center justify-center text-[10px] font-mono font-bold">1</span>
                    Dietary Preference &amp; Food Source
                  </span>
                  <span className="text-[10px] font-mono text-[#a43716] font-bold">Click to Select</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "VEG", label: "🥗 Vegetarian", desc: "Paneer, Dal, Dairy, Tofu" },
                    { id: "EGGETARIAN", label: "🥚 Eggetarian", desc: "Eggs + Vegetarian" },
                    { id: "NON_VEG", label: "🍗 Non-Veg", desc: "Chicken, Fish, Eggs" },
                    { id: "VEGAN", label: "🌿 100% Vegan", desc: "Plant-based only" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setDietPreference(opt.id as any);
                        scrollToNextQuestion("q-goal");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        dietPreference === opt.id
                          ? "bg-[#a43716] text-white border-[#a43716] shadow-xs"
                          : "bg-white border-[#dfc0b7] text-[#1f1b14] hover:bg-[#fcf2e6]"
                      }`}
                    >
                      <span className="font-bold text-xs block">{opt.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${dietPreference === opt.id ? "text-white/80" : "text-[#8b716a]"}`}>
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Primary Focus / Goal */}
              <div id="q-goal" className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7] space-y-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1f1b14] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#a43716] text-white flex items-center justify-center text-[10px] font-mono font-bold">2</span>
                    Primary Goal &amp; Deficit Strategy
                  </span>
                  <span className="text-[10px] font-mono text-[#52652a] font-bold">Protocol Objective</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "FAT_LOSS", label: "🔥 Aggressive Fat Loss (Cut)", desc: "Caloric deficit, maximum fat burn" },
                    { id: "RECOMP", label: "⚡ Body Recomposition", desc: "Tone muscle while reducing body fat" },
                    { id: "HYPERTROPHY", label: "🏋️ Lean Muscle Hypertrophy", desc: "Clean mass with controlled energy" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setPrimaryGoal(opt.id as any);
                        scrollToNextQuestion("q-calories");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        primaryGoal === opt.id
                          ? "bg-[#a43716] text-white border-[#a43716] shadow-xs"
                          : "bg-white border-[#dfc0b7] text-[#1f1b14] hover:bg-[#fcf2e6]"
                      }`}
                    >
                      <span className="font-bold text-xs block">{opt.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${primaryGoal === opt.id ? "text-white/80" : "text-[#8b716a]"}`}>
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3: Daily Calorie Target */}
              <div id="q-calories" className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7] space-y-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1f1b14] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#a43716] text-white flex items-center justify-center text-[10px] font-mono font-bold">3</span>
                    Daily Caloric Budget
                  </span>
                  <span className="text-[10px] font-mono text-[#a43716] font-bold">Current Target: {dailyCalories} kcal</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 1400, label: "1,400 kcal", tag: "Strict Cut" },
                    { val: 1600, label: "1,600 kcal ⭐", tag: "Recommended Deficit" },
                    { val: 1800, label: "1,800 kcal", tag: "Moderate Deficit" },
                    { val: 2000, label: "2,000 kcal", tag: "Maintenance" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setDailyCalories(opt.val);
                        scrollToNextQuestion("q-protein");
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        dailyCalories === opt.val
                          ? "bg-[#a43716] text-white border-[#a43716] shadow-xs"
                          : "bg-white border-[#dfc0b7] text-[#1f1b14] hover:bg-[#fcf2e6]"
                      }`}
                    >
                      <span className="font-bold text-sm block font-mono">{opt.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${dailyCalories === opt.val ? "text-white/80" : "text-[#8b716a]"}`}>
                        {opt.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 4: Protein Target */}
              <div id="q-protein" className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7] space-y-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1f1b14] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#a43716] text-white flex items-center justify-center text-[10px] font-mono font-bold">4</span>
                    Daily Protein Target
                  </span>
                  <span className="text-[10px] font-mono text-[#52652a] font-bold">Current Target: {proteinTarget}g</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 110, label: "110g Protein", tag: "Moderate" },
                    { val: 130, label: "130g Protein ⭐", tag: "Standard Protocol" },
                    { val: 145, label: "145g Protein", tag: "High Satiety" },
                    { val: 160, label: "160g Protein", tag: "Athlete Level" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setProteinTarget(opt.val);
                        scrollToNextQuestion("q-meals");
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        proteinTarget === opt.val
                          ? "bg-[#52652a] text-white border-[#52652a] shadow-xs"
                          : "bg-white border-[#dfc0b7] text-[#1f1b14] hover:bg-[#fcf2e6]"
                      }`}
                    >
                      <span className="font-bold text-sm block font-mono">{opt.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${proteinTarget === opt.val ? "text-white/80" : "text-[#8b716a]"}`}>
                        {opt.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 5: Meal Structure */}
              <div id="q-meals" className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7] space-y-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1f1b14] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#a43716] text-white flex items-center justify-center text-[10px] font-mono font-bold">5</span>
                    Meal Frequency &amp; Distribution
                  </span>
                  <span className="text-[10px] font-mono text-[#8b716a] font-bold">Circadian Rhythm</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { val: 3, label: "3 Meals / Day", desc: "Breakfast • Lunch • Dinner" },
                    { val: 4, label: "4 Meals / Day ⭐", desc: "Breakfast • Lunch • Snack • Dinner" },
                    { val: 5, label: "5 Meals / Day", desc: "Pre-Workout • 3 Meals • Evening Snack" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setMealCount(opt.val);
                        scrollToNextQuestion("q-steps");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        mealCount === opt.val
                          ? "bg-[#a43716] text-white border-[#a43716] shadow-xs"
                          : "bg-white border-[#dfc0b7] text-[#1f1b14] hover:bg-[#fcf2e6]"
                      }`}
                    >
                      <span className="font-bold text-xs block">{opt.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${mealCount === opt.val ? "text-white/80" : "text-[#8b716a]"}`}>
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 6: Daily Steps */}
              <div id="q-steps" className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7] space-y-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1f1b14] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#a43716] text-white flex items-center justify-center text-[10px] font-mono font-bold">6</span>
                    Daily Steps &amp; NEAT Conditioning
                  </span>
                  <span className="text-[10px] font-mono text-[#8b716a] font-bold">Active Energy</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 6000, label: "6,000 steps", tag: "Baseline" },
                    { val: 8000, label: "8,000 steps ⭐", tag: "Standard Deficit" },
                    { val: 10000, label: "10,000 steps", tag: "Active Burn" },
                    { val: 12000, label: "12,000 steps", tag: "Peak Condition" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setDailySteps(opt.val);
                        scrollToNextQuestion("q-water");
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        dailySteps === opt.val
                          ? "bg-[#a43716] text-white border-[#a43716] shadow-xs"
                          : "bg-white border-[#dfc0b7] text-[#1f1b14] hover:bg-[#fcf2e6]"
                      }`}
                    >
                      <span className="font-bold text-sm block font-mono">{opt.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${dailySteps === opt.val ? "text-white/80" : "text-[#8b716a]"}`}>
                        {opt.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 7: Hydration */}
              <div id="q-water" className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7] space-y-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1f1b14] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#a43716] text-white flex items-center justify-center text-[10px] font-mono font-bold">7</span>
                    Daily Cellular Hydration Target
                  </span>
                  <span className="text-[10px] font-mono text-[#0284c7] font-bold">Fluid Protocol</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 2500, label: "2.5 Liters", tag: "2,500 ml" },
                    { val: 3000, label: "3.0 Liters ⭐", tag: "3,000 ml Protocol" },
                    { val: 3500, label: "3.5 Liters", tag: "3,500 ml High" },
                    { val: 4000, label: "4.0 Liters", tag: "4,000 ml Athlete" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setDailyWaterMl(opt.val);
                        scrollToNextQuestion("q-workout");
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        dailyWaterMl === opt.val
                          ? "bg-[#0284c7] text-white border-[#0284c7] shadow-xs"
                          : "bg-white border-[#dfc0b7] text-[#1f1b14] hover:bg-[#fcf2e6]"
                      }`}
                    >
                      <span className="font-bold text-sm block font-mono">{opt.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${dailyWaterMl === opt.val ? "text-white/80" : "text-[#8b716a]"}`}>
                        {opt.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 8: Workout Timing */}
              <div id="q-workout" className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7] space-y-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1f1b14] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#a43716] text-white flex items-center justify-center text-[10px] font-mono font-bold">8</span>
                    Workout &amp; Training Window
                  </span>
                  <span className="text-[10px] font-mono text-[#8b716a] font-bold">Daily Routine Schedule</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "MORNING", label: "🌅 Morning (07:00)", desc: "Fast session + Breakfast" },
                    { id: "EVENING", label: "🌇 Evening (18:00) ⭐", desc: "Post-work + Evening snack" },
                    { id: "NIGHT", label: "🌙 Night (20:30)", desc: "Late session + Dinner" },
                    { id: "WALK_ONLY", label: "🚶 Walks Only", desc: "Daily conditioning walks" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setWorkoutTiming(opt.id as any);
                        scrollToNextQuestion("q-gemini-guide");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        workoutTiming === opt.id
                          ? "bg-[#a43716] text-white border-[#a43716] shadow-xs"
                          : "bg-white border-[#dfc0b7] text-[#1f1b14] hover:bg-[#fcf2e6]"
                      }`}
                    >
                      <span className="font-bold text-xs block">{opt.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${workoutTiming === opt.id ? "text-white/80" : "text-[#8b716a]"}`}>
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── READ THIS FIRST: Gemini-Only Meal Plan Guide ─── */}
            <div id="q-gemini-guide" className="p-6 rounded-2xl bg-[#fff8f2] border-2 border-[#a43716]/40 space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2 pb-2 border-b border-[#dfc0b7]">
                <span className="text-xl">📖</span>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#1f1b14]">
                    Read This First Before Applying Prompt (Google Gemini Only)
                  </h3>
                  <p className="text-xs text-[#a43716] font-semibold">
                    Follow these 4 simple steps to prepare your custom meal plan with Google Gemini
                  </p>
                </div>
              </div>

              {/* Instructions Steps Box */}
              <div className="space-y-3 text-xs text-[#58423c] leading-relaxed">
                <div className="p-3.5 rounded-xl bg-white border border-[#dfc0b7] space-y-1">
                  <span className="font-bold text-[#1f1b14] block">
                    1. Google Gemini Only (gemini.google.com)
                  </span>
                  <p>
                    Our protocol structure is specifically designed for <strong>Google Gemini</strong>. Do not use ChatGPT or others because Gemini outputs clean, exact numerical JSON arrays without conversational token bloat.
                  </p>
                  <a
                    href="https://gemini.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono font-bold text-[#a43716] hover:underline mt-1"
                  >
                    <span>Launch Google Gemini ↗</span>
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#dfc0b7] space-y-1">
                  <span className="font-bold text-[#1f1b14] block">
                    2. How to Put the Prompt &amp; Edit the Plan Right in Gemini
                  </span>
                  <p>
                    Click the <strong>&ldquo;📋 Copy Gemini Master Prompt&rdquo;</strong> button below and paste it into Gemini.
                    <br />
                    <strong>Want to change any foods?</strong> You can converse with Gemini right in that chat! For example, reply:
                    <br />
                    <code className="text-[11px] bg-[#fcf2e6] text-[#a43716] px-2 py-0.5 rounded font-mono block mt-1">
                      &ldquo;I don&apos;t like oats or peanuts. Replace breakfast with paneer stuffed roti while keeping total calories at 450 kcal and protein at 25g. Give me the updated JSON array.&rdquo;
                    </code>
                    Gemini will immediately revise the food items and give you the updated JSON array.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#dfc0b7] space-y-2">
                  <span className="font-bold text-[#1f1b14] block">
                    3. Exact Example of What Gemini Will Output (Copy This JSON):
                  </span>
                  <p className="text-[11px] text-[#8b716a]">
                    Gemini will give you a code box formatted like this. Simply copy the JSON array code block:
                  </p>
                  <pre className="p-3 rounded-xl bg-[#14120e] text-[#d4eca2] font-mono text-[10px] overflow-x-auto leading-relaxed border border-black/40">
{`[
  {
    "title": "Chocolate Peanut Butter Proats",
    "category": "MEAL",
    "scheduledTime": "10:15",
    "calories": 450,
    "protein": 30,
    "carbs": 52,
    "fat": 11,
    "mealType": "BREAKFAST"
  },
  {
    "title": "2 Phulkas + Paneer Bhurji & Yellow Dal",
    "category": "MEAL",
    "scheduledTime": "12:30",
    "calories": 520,
    "protein": 28,
    "carbs": 62,
    "fat": 14,
    "mealType": "LUNCH"
  },
  {
    "title": "Roasted Makhana / Boiled Kala Chana",
    "category": "MEAL",
    "scheduledTime": "17:30",
    "calories": 200,
    "protein": 11,
    "carbs": 32,
    "fat": 4,
    "mealType": "SNACK"
  },
  {
    "title": "Tofu Stir Fry with 2 Multigrain Rotis",
    "category": "MEAL",
    "scheduledTime": "19:00",
    "calories": 430,
    "protein": 26,
    "carbs": 44,
    "fat": 15,
    "mealType": "DINNER"
  }
]`}
                  </pre>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#dfc0b7] space-y-1">
                  <span className="font-bold text-[#1f1b14] block">
                    4. Paste It Back Here &amp; Click Apply
                  </span>
                  <p>
                    Paste Gemini&apos;s JSON output into the box below and click <strong>&ldquo;⚡ Parse &amp; Apply Blueprint&rdquo;</strong>. It will immediately populate your complete daily timeline in Step 4!
                  </p>
                </div>
              </div>

              {/* Master Prompt Copy Action Box */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={copyPromptToClipboard}
                    className="px-6 py-3 rounded-xl bg-[#52652a] hover:bg-[#3b4d14] text-white font-mono text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{promptCopied ? "✓ Master Prompt Copied!" : "📋 Copy Gemini Master Prompt"}</span>
                    <span className="text-[10px] opacity-75 font-normal">({dailyCalories} kcal • {dietPreference})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPromptPreview(!showPromptPreview)}
                    className="px-3.5 py-3 rounded-xl border border-[#dfc0b7] bg-white text-[#58423c] hover:bg-[#fcf2e6] text-xs font-bold font-mono transition-all cursor-pointer"
                  >
                    {showPromptPreview ? "Hide Prompt ✕" : "👁️ View Prompt Text"}
                  </button>
                </div>

                <a
                  href="https://gemini.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl border border-[#dfc0b7] bg-white text-[#1f1b14] hover:bg-[#fcf2e6] text-xs font-bold text-center transition-all shadow-2xs"
                >
                  Open Google Gemini ↗
                </a>
              </div>

              {/* Collapsible Prompt Preview */}
              {showPromptPreview && (
                <div className="p-3.5 rounded-xl bg-[#1f1b14] border border-[#a43716]/40 text-[#fcf2e6] space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#d4eca2]">
                      Live Generated Prompt for Google Gemini
                    </span>
                    <button
                      type="button"
                      onClick={copyPromptToClipboard}
                      className="text-[10px] font-mono text-[#a43716] bg-white px-2 py-0.5 rounded font-bold hover:bg-[#fcf2e6]"
                    >
                      {promptCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-neutral-300 max-h-60 overflow-y-auto">
                    {geminiPromptTemplate}
                  </pre>
                </div>
              )}

              {/* JSON Paste Box */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-mono font-bold text-[#1f1b14] block">
                  Paste Gemini&apos;s JSON Output Here:
                </label>
                <textarea
                  rows={4}
                  value={geminiJsonText}
                  onChange={(e) => setGeminiJsonText(e.target.value)}
                  placeholder="Paste Gemini's JSON array response here e.g. [{ title: '...', calories: 450, ... }]"
                  className="w-full p-3 rounded-xl border border-[#dfc0b7] bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#a43716]"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleParseGeminiJson}
                    disabled={!geminiJsonText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#a43716] hover:bg-[#8e2e12] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    ⚡ Parse &amp; Apply Blueprint
                  </button>

                  {jsonParseSuccess && (
                    <span className="text-xs font-mono font-bold text-[#52652a] bg-[#f7faef] px-3 py-1.5 rounded-lg border border-[#52652a]/20">
                      {jsonParseSuccess}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Step Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-[#dfc0b7]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2 rounded-xl border border-[#dfc0b7] text-[#58423c] font-bold text-xs hover:bg-[#fcf2e6] cursor-pointer"
              >
                ← Back to Phase 1
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-xl bg-[#a43716] text-white font-bold text-xs shadow-xs hover:bg-[#8e2e12] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Proceed to Daily Blueprint →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 4: Review / Customize Routine Schedule ─── */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 border border-[#dfc0b7] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716]">
                  Step 4 • Daily Routine Blueprint
                </span>
                <h2 className="text-xl font-serif font-bold text-[#1f1b14] mt-0.5">
                  Confirm Daily Meal &amp; Workout Timing
                </h2>
                <p className="text-xs text-[#58423c]">
                  Your day&apos;s schedule will load on Home with these exact items. Adjust times or calories if needed.
                </p>
              </div>

              <div className="text-left sm:text-right bg-[#fcf2e6] px-3.5 py-1.5 rounded-xl border border-[#dfc0b7]">
                <span className="text-xs font-serif font-bold text-[#1f1b14]">
                  {totalBlueprintCalories} / {dailyCalories} kcal
                </span>
                <span className="text-[10px] font-mono text-[#52652a] block">
                  {totalBlueprintProtein}g Protein Tracked
                </span>
              </div>
            </div>

            {/* List of routine items */}
            <div className="space-y-2.5">
              {routineItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-2xl border border-[#dfc0b7] bg-white hover:bg-[#fcf2e6]/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={item.scheduledTime}
                      onChange={(e) => {
                        const updated = [...routineItems];
                        updated[idx].scheduledTime = e.target.value;
                        setRoutineItems(updated);
                      }}
                      className="font-mono text-xs font-bold px-2 py-1 rounded-lg border border-[#dfc0b7] bg-[#fcf2e6]/40 text-[#1f1b14]"
                    />
                    <div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...routineItems];
                          updated[idx].title = e.target.value;
                          setRoutineItems(updated);
                        }}
                        className="font-semibold text-[#1f1b14] bg-transparent border-b border-transparent hover:border-[#dfc0b7] focus:border-[#a43716] focus:outline-none"
                      />
                      <span className="text-[10px] font-mono text-[#8b716a] block capitalize">
                        {item.category.toLowerCase()} {item.mealType !== "OTHER" ? `• ${item.mealType.toLowerCase()}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-1.5 font-mono">
                      <input
                        type="number"
                        value={item.calories}
                        onChange={(e) => {
                          const updated = [...routineItems];
                          updated[idx].calories = parseInt(e.target.value, 10) || 0;
                          setRoutineItems(updated);
                        }}
                        className="w-14 text-right font-bold text-[#a43716] bg-transparent border-b border-transparent hover:border-[#dfc0b7] focus:outline-none"
                      />
                      <span className="text-[10px] text-[#8b716a]">kcal</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRoutineItems(routineItems.filter((_, i) => i !== idx));
                      }}
                      className="text-[#ba1a1a] hover:bg-[#ffdad6] p-1 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Routine Item Button */}
            <button
              type="button"
              onClick={() => {
                setRoutineItems([
                  ...routineItems,
                  {
                    id: `custom-item-${Date.now()}`,
                    title: "New Custom Routine Item",
                    category: "MEAL",
                    scheduledTime: "15:00",
                    calories: 200,
                    protein: 10,
                    carbs: 20,
                    fat: 5,
                    mealType: "SNACK",
                  },
                ]);
              }}
              className="w-full py-2.5 rounded-xl border border-dashed border-[#dfc0b7] hover:border-[#a43716] text-[#a43716] font-bold text-xs transition-colors"
            >
              + Add Another Meal or Routine Item
            </button>

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2 rounded-xl border border-[#dfc0b7] text-[#58423c] font-bold text-xs hover:bg-[#fcf2e6]"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-6 py-2.5 rounded-xl bg-[#a43716] text-white font-bold text-xs shadow-xs hover:bg-[#8e2e12] transition-all"
              >
                Proceed to Review &amp; Activate →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 5: Final Review & Activation ─── */}
      {step === 5 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 border border-[#dfc0b7] shadow-xs space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#52652a]">
                Step 5 • Activation Ready
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#1f1b14] mt-0.5">
                Ready to Initialize Protocol
              </h2>
              <p className="text-xs text-[#58423c]">
                Review your customized protocol configuration. Clicking activate will initialize your Today dashboard, generate the 14-day schedule, and log your baseline telemetry.
              </p>
            </div>

            {/* Executive Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7]">
                <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a] block">Protocol Phase</span>
                <h4 className="text-base font-serif font-bold text-[#1f1b14] mt-1">{phaseName}</h4>
                <p className="text-xs text-[#58423c]">{phaseSubtitle}</p>
                <span className="text-[10px] font-mono text-[#a43716] font-bold mt-2 block">
                  {totalPhaseDays} days ({startDate} to {endDate})
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7]">
                <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a] block">Biometrics &amp; Body</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-serif font-bold text-[#1f1b14]">{currentWeight} kg</span>
                  <span className="text-xs text-[#8b716a]">→</span>
                  <span className="text-lg font-serif font-bold text-[#52652a]">{targetWeight} kg</span>
                </div>
                <span className="text-[10px] text-[#58423c] block mt-0.5">
                  Target: {(currentWeight - targetWeight).toFixed(1)} kg reduction
                </span>
                <span className="text-[10px] font-mono text-[#8b716a] block mt-1">
                  User Name: {name}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7]">
                <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a] block">Daily Intake Standard</span>
                <div className="text-lg font-serif font-bold text-[#a43716] mt-1">
                  {dailyCalories} <span className="text-xs font-sans text-[#8b716a]">kcal / day</span>
                </div>
                <span className="text-[10px] text-[#52652a] font-bold block">
                  {proteinTarget}g Protein • {dailyWaterMl}ml Water
                </span>
                <span className="text-[10px] font-mono text-[#8b716a] block mt-1">
                  {routineItems.length} Routine Events Configured
                </span>
              </div>
            </div>

            {/* Launch Action */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1f1b14] via-[#2d271e] to-[#14120e] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div>
                <h4 className="text-base font-serif font-bold">Commit &amp; Launch Schedulfy</h4>
                <p className="text-xs text-white/70">
                  Your customized schedule and baseline will be committed live to PostgreSQL.
                </p>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={handleCompleteSetup}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#a43716] hover:bg-[#8e2e12] active:scale-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Activating Protocol...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Activate Protocol &amp; Open Home</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-5 py-2 rounded-xl border border-[#dfc0b7] text-[#58423c] font-bold text-xs hover:bg-[#fcf2e6]"
              >
                ← Back to Blueprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
