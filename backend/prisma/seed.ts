import { PrismaClient } from "@prisma/client";
import { todayUtc, addDays, matchesRecurrence } from "../src/dates";

const prisma = new PrismaClient();

interface MealItemDef {
  title: string;
  category: "MEAL" | "WORKOUT" | "SUPPLEMENT" | "ACTIVITY" | "HYDRATION" | "OTHER";
  recurrence: string; // "DAILY", "MON", "TUE,THU,SAT", etc.
  time: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealType?: "BREAKFAST" | "LUNCH" | "SNACK" | "DINNER" | "BEDTIME";
  components?: Array<{ name: string; quantity?: string; unit?: string }>;
}

async function main() {
  console.log("🔄 Resetting database & seeding personalized 7-Day Diet & Routine...");

  // 1. Clear operational transaction data
  console.log("  🧹 Cleaning existing routine & occurrence records...");
  await prisma.completion.deleteMany({});
  await prisma.nutritionSnapshot.deleteMany({});
  await prisma.occurrence.deleteMany({});
  await prisma.alternative.deleteMany({});
  await prisma.mealComponent.deleteMany({});
  await prisma.meal.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.routineItem.deleteMany({});
  await prisma.plan.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.monthlyGoal.deleteMany({});

  // 2. Ensure Core System Users
  const user = await prisma.user.upsert({
    where: { role: "USER" },
    update: {},
    create: { role: "USER" },
  });

  const mom = await prisma.user.upsert({
    where: { role: "MOM" },
    update: {},
    create: { role: "MOM" },
  });

  // Ensure UserProfiles
  const userPin = process.env.USER_PIN || "1234";
  const momPin = process.env.MOM_PIN || "5678";

  await prisma.userProfile.upsert({
    where: { pin: userPin },
    update: {
      calorieTarget: 1535,
      proteinTarget: 141,
      stepsTarget: 8000,
      waterTargetMl: 3000,
      isAdmin: true,
      name: "Vrund",
    },
    create: {
      name: "Vrund",
      pin: userPin,
      role: "USER",
      calorieTarget: 1535,
      proteinTarget: 141,
      stepsTarget: 8000,
      waterTargetMl: 3000,
      isAdmin: true,
    },
  });

  await prisma.userProfile.upsert({
    where: { pin: momPin },
    update: {
      name: "Mom",
      role: "MOM",
      isAdmin: false,
    },
    create: {
      name: "Mom",
      pin: momPin,
      role: "MOM",
      isAdmin: false,
    },
  });

  // System settings
  await prisma.systemSetting.upsert({
    where: { key: "admin_name" },
    create: { key: "admin_name", value: "Vrund" },
    update: { value: "Vrund" },
  });
  await prisma.systemSetting.upsert({
    where: { key: "mom_name" },
    create: { key: "mom_name", value: "Mom" },
    update: { value: "Mom" },
  });
  if (process.env.UPTIMEROBOT_API_KEY) {
    await prisma.systemSetting.upsert({
      where: { key: "uptimerobot_api_key" },
      create: { key: "uptimerobot_api_key", value: process.env.UPTIMEROBOT_API_KEY },
      update: { value: process.env.UPTIMEROBOT_API_KEY },
    });
  }

  // Active Phase setting
  await prisma.systemSetting.upsert({
    where: { key: `phase_${user.id}` },
    create: {
      key: `phase_${user.id}`,
      value: JSON.stringify({
        phaseTitle: "Phase 1 — Winter Arc",
        phaseSubtitle: "Discipline, High Protein & Lean Recomposition",
        theme: "Discipline",
        targetWeightKg: 72.0,
        targetCalories: 1535,
        targetProtein: 141,
        endDate: "2026-11-30",
      }),
    },
    update: {
      value: JSON.stringify({
        phaseTitle: "Phase 1 — Winter Arc",
        phaseSubtitle: "Discipline, High Protein & Lean Recomposition",
        theme: "Discipline",
        targetWeightKg: 72.0,
        targetCalories: 1535,
        targetProtein: 141,
        endDate: "2026-11-30",
      }),
    },
  });

  // 3. Create the Main Active Plan
  const plan = await prisma.plan.create({
    data: {
      name: "Phase 1 — Schedulify Personalized Routine",
      category: "DAILY_OS",
      status: "ACTIVE",
    },
  });
  console.log(`  ✓ Created Plan: ${plan.name}`);

  const today = todayUtc();
  const effectiveStartDate = addDays(today, -7);

  // 4. Define All Personalized Routine & Meal Items
  const itemsToCreate: MealItemDef[] = [
    // ─── DAILY ANCHORS ───
    {
      title: "Hydration Protocol (3L Target)",
      category: "HYDRATION",
      recurrence: "DAILY",
      time: "08:00",
    },
    {
      title: "Chocolate Proats Bowl + 3g Creatine",
      category: "MEAL",
      mealType: "BREAKFAST",
      recurrence: "DAILY",
      time: "10:15",
      calories: 330,
      protein: 30,
      carbs: 36,
      fat: 6,
      components: [
        { name: "Rolled Oats", quantity: "50", unit: "g" },
        { name: "Whey Protein (Chocolate)", quantity: "1", unit: "scoop" },
        { name: "Creatine Monohydrate", quantity: "3", unit: "g" },
        { name: "Water / Light Almond Milk", quantity: "200", unit: "ml" },
      ],
    },
    {
      title: "1-Hour Evening Walk",
      category: "WORKOUT",
      recurrence: "DAILY",
      time: "20:00",
    },
    {
      title: "Bedtime Whey & Milk Shake",
      category: "MEAL",
      mealType: "BEDTIME",
      recurrence: "DAILY",
      time: "23:30",
      calories: 290,
      protein: 28,
      carbs: 15,
      fat: 8,
      components: [
        { name: "Whey Protein", quantity: "1", unit: "scoop" },
        { name: "Amul Taaza Milk", quantity: "250", unit: "ml" },
      ],
    },

    // ─── DIGESTIVE SUPPORT (TUE, WED, FRI, SUN) ───
    {
      title: "1 Glass Water + 1 tbsp Isabgol",
      category: "HYDRATION",
      recurrence: "TUE,WED,FRI,SUN",
      time: "21:30",
      calories: 15,
      protein: 0,
      carbs: 4,
      fat: 0,
      components: [
        { name: "Isabgol Husk", quantity: "1", unit: "tbsp" },
        { name: "Water", quantity: "250", unit: "ml" },
      ],
    },

    // ─── LUNCH PROTOCOLS (12:30 PM) ───
    {
      title: "2 Phulkas + Cabbage-Capsicum Sabzi + Salad + 150g Dahi",
      category: "MEAL",
      mealType: "LUNCH",
      recurrence: "MON,THU",
      time: "12:30",
      calories: 360,
      protein: 13,
      carbs: 50,
      fat: 9,
      components: [
        { name: "Phulkas", quantity: "2", unit: "pcs" },
        { name: "Cabbage-Capsicum Sabzi (1 tsp oil)", quantity: "1", unit: "bowl" },
        { name: "Large Cucumber/Cabbage Salad", quantity: "1", unit: "plate" },
        { name: "Fresh Dahi", quantity: "150", unit: "g" },
      ],
    },
    {
      title: "2 Phulkas + Bhindi/Gourd Sabzi + Raw Salad + Yakult Light",
      category: "MEAL",
      mealType: "LUNCH",
      recurrence: "TUE",
      time: "12:30",
      calories: 320,
      protein: 9,
      carbs: 58,
      fat: 6,
      components: [
        { name: "Phulkas", quantity: "2", unit: "pcs" },
        { name: "Bhindi / Gourd Sabzi", quantity: "1", unit: "bowl" },
        { name: "Big Bowl Raw Salad", quantity: "1", unit: "bowl" },
        { name: "Yakult Light", quantity: "1", unit: "bottle" },
      ],
    },
    {
      title: "Mom’s Steamed Paneer Manchurian + Steamed Rice + Salad",
      category: "MEAL",
      mealType: "LUNCH",
      recurrence: "WED",
      time: "12:30",
      calories: 410,
      protein: 23,
      carbs: 38,
      fat: 20,
      components: [
        { name: "Steamed Paneer Manchurian (100g Paneer, cabbage, light garlic/soy)", quantity: "100", unit: "g" },
        { name: "Steamed Rice", quantity: "1", unit: "small bowl" },
        { name: "Crunchy Salad", quantity: "1", unit: "plate" },
      ],
    },
    {
      title: "High-Protein Paneer Cheese Toast Sandwiches + Yakult Light",
      category: "MEAL",
      mealType: "LUNCH",
      recurrence: "FRI",
      time: "12:30",
      calories: 470,
      protein: 24,
      carbs: 52,
      fat: 18,
      components: [
        { name: "Brown Bread Slices (Lightly toasted)", quantity: "4", unit: "slices" },
        { name: "Amul Paneer (Grated)", quantity: "60", unit: "g" },
        { name: "Amul Cheese Slice/Cube", quantity: "25", unit: "g" },
        { name: "Chopped Cabbage, Capsicum & Tomato", quantity: "1", unit: "cup" },
        { name: "Yakult Light", quantity: "1", unit: "bottle" },
      ],
    },
    {
      title: "2 Phulkas + Gourd/Bhindi Sabzi + Crunchy Salad + 150g Dahi",
      category: "MEAL",
      mealType: "LUNCH",
      recurrence: "SAT",
      time: "12:30",
      calories: 350,
      protein: 12,
      carbs: 50,
      fat: 8,
      components: [
        { name: "Phulkas", quantity: "2", unit: "pcs" },
        { name: "Gourd / Bhindi Sabzi", quantity: "1", unit: "bowl" },
        { name: "Crunchy Salad", quantity: "1", unit: "plate" },
        { name: "Fresh Dahi", quantity: "150", unit: "g" },
      ],
    },
    {
      title: "2 Phulkas + Mom's Sabzi + Large Salad + 150g Fresh Dahi",
      category: "MEAL",
      mealType: "LUNCH",
      recurrence: "SUN",
      time: "12:30",
      calories: 360,
      protein: 13,
      carbs: 50,
      fat: 9,
      components: [
        { name: "Phulkas", quantity: "2", unit: "pcs" },
        { name: "Mom's Fresh Sabzi", quantity: "1", unit: "bowl" },
        { name: "Large Salad", quantity: "1", unit: "plate" },
        { name: "Fresh Dahi", quantity: "150", unit: "g" },
      ],
    },

    // ─── SNACK PROTOCOLS (05:30 PM) ───
    {
      title: "Boiled Kala Chana Chaat",
      category: "MEAL",
      mealType: "SNACK",
      recurrence: "MON,WED,SUN",
      time: "17:30",
      calories: 180,
      protein: 10,
      carbs: 28,
      fat: 2.5,
      components: [
        { name: "Boiled Kala Chana (50g raw / ~120g boiled)", quantity: "1", unit: "bowl" },
        { name: "Chopped Onions, Tomato, Lemon & Chillies", quantity: "1", unit: "serving" },
      ],
    },
    {
      title: "Street Snack: 4 Boiled Eggs (2 Whole + 2 Whites)",
      category: "MEAL",
      mealType: "SNACK",
      recurrence: "TUE,THU,SAT",
      time: "17:30",
      calories: 210,
      protein: 18,
      carbs: 1,
      fat: 10,
      components: [
        { name: "Whole Boiled Eggs", quantity: "2", unit: "pcs" },
        { name: "Boiled Egg Whites", quantity: "2", unit: "pcs" },
        { name: "Salt & Pepper", quantity: "1", unit: "pinch" },
      ],
    },
    {
      title: "Coffee/Tea + Cucumber, Carrot & Roasted Chana",
      category: "MEAL",
      mealType: "SNACK",
      recurrence: "FRI",
      time: "17:30",
      calories: 120,
      protein: 6,
      carbs: 18,
      fat: 2,
      components: [
        { name: "Black Coffee or Tea", quantity: "1", unit: "cup" },
        { name: "Cucumber & Carrot Sticks", quantity: "1", unit: "bowl" },
        { name: "Roasted Chana", quantity: "30", unit: "g" },
      ],
    },

    // ─── DINNER PROTOCOLS (07:00 PM) ───
    {
      title: "100g Amul Paneer Bhurji + 1 Phulka + Salad",
      category: "MEAL",
      mealType: "DINNER",
      recurrence: "MON",
      time: "19:00",
      calories: 430,
      protein: 22,
      carbs: 24,
      fat: 25,
      components: [
        { name: "Amul Paneer Bhurji (with onion/capsicum, 1 tsp oil)", quantity: "100", unit: "g" },
        { name: "Phulka", quantity: "1", unit: "pc" },
        { name: "Green Salad", quantity: "1", unit: "plate" },
      ],
    },
    {
      title: "2 Phulkas + Lauki Sabzi + Cucumber Salad + 100g Dahi",
      category: "MEAL",
      mealType: "DINNER",
      recurrence: "TUE",
      time: "19:00",
      calories: 350,
      protein: 12,
      carbs: 54,
      fat: 8,
      components: [
        { name: "Phulkas", quantity: "2", unit: "pcs" },
        { name: "Lauki Sabzi", quantity: "1", unit: "bowl" },
        { name: "Cucumber Salad", quantity: "1", unit: "plate" },
        { name: "Fresh Dahi", quantity: "100", unit: "g" },
      ],
    },
    {
      title: "1 Phulka + French Beans Sabzi + 150g Fresh Dahi + Salad",
      category: "MEAL",
      mealType: "DINNER",
      recurrence: "WED",
      time: "19:00",
      calories: 310,
      protein: 11,
      carbs: 42,
      fat: 9,
      components: [
        { name: "Phulka", quantity: "1", unit: "pc" },
        { name: "French Beans Sabzi", quantity: "1", unit: "bowl" },
        { name: "Fresh Dahi", quantity: "150", unit: "g" },
        { name: "Fresh Salad", quantity: "1", unit: "plate" },
      ],
    },
    {
      title: "2 Phulkas + Tinda/Lauki Sabzi + Green Salad",
      category: "MEAL",
      mealType: "DINNER",
      recurrence: "THU",
      time: "19:00",
      calories: 290,
      protein: 8,
      carbs: 50,
      fat: 5,
      components: [
        { name: "Phulkas", quantity: "2", unit: "pcs" },
        { name: "Tinda / Lauki Sabzi", quantity: "1", unit: "bowl" },
        { name: "Green Salad", quantity: "1", unit: "plate" },
      ],
    },
    {
      title: "1 Phulka + Mixed Green Sabzi + 150g Fresh Dahi + Salad",
      category: "MEAL",
      mealType: "DINNER",
      recurrence: "FRI",
      time: "19:00",
      calories: 310,
      protein: 11,
      carbs: 42,
      fat: 9,
      components: [
        { name: "Phulka", quantity: "1", unit: "pc" },
        { name: "Mixed Green Sabzi", quantity: "1", unit: "bowl" },
        { name: "Fresh Dahi", quantity: "150", unit: "g" },
        { name: "Fresh Salad", quantity: "1", unit: "plate" },
      ],
    },
    {
      title: "2 Phulkas + Stir-fried Cabbage & Tomato Sabzi + Big Bowl Cucumber Salad",
      category: "MEAL",
      mealType: "DINNER",
      recurrence: "SAT",
      time: "19:00",
      calories: 290,
      protein: 8,
      carbs: 50,
      fat: 5,
      components: [
        { name: "Phulkas", quantity: "2", unit: "pcs" },
        { name: "Stir-fried Cabbage & Tomato Sabzi", quantity: "1", unit: "bowl" },
        { name: "Big Bowl Cucumber Salad", quantity: "1", unit: "plate" },
      ],
    },
    {
      title: "100g Amul Paneer (Pan-seared / Bhurji) + 1 Phulka + Lemon Salad",
      category: "MEAL",
      mealType: "DINNER",
      recurrence: "SUN",
      time: "19:00",
      calories: 430,
      protein: 22,
      carbs: 24,
      fat: 25,
      components: [
        { name: "Amul Paneer (Pan-seared cubes with chaat masala or bhurji)", quantity: "100", unit: "g" },
        { name: "Phulka", quantity: "1", unit: "pc" },
        { name: "Lemon Salad", quantity: "1", unit: "plate" },
      ],
    },
  ];

  // 5. Insert All Routine Items, Schedules, Meals, and Components
  const createdItems: Array<{ id: string; title: string }> = [];

  for (let sortOrder = 0; sortOrder < itemsToCreate.length; sortOrder++) {
    const def = itemsToCreate[sortOrder];
    const item = await prisma.routineItem.create({
      data: {
        planId: plan.id,
        title: def.title,
        category: def.category,
        sortOrder,
      },
    });

    createdItems.push({ id: item.id, title: item.title });

    // Schedule
    await prisma.schedule.create({
      data: {
        routineItemId: item.id,
        recurrenceRule: def.recurrence,
        scheduledTime: def.time,
        effectiveFrom: effectiveStartDate,
      },
    });

    // Planned nutrition snapshot
    if (def.calories !== undefined) {
      await prisma.nutritionSnapshot.create({
        data: {
          routineItemId: item.id,
          source: "PLANNED",
          calories: def.calories,
          protein: def.protein ?? 0,
          carbs: def.carbs ?? 0,
          fat: def.fat ?? 0,
        },
      });
    }

    // Meal & components
    if (def.mealType) {
      const meal = await prisma.meal.create({
        data: {
          routineItemId: item.id,
          mealType: def.mealType,
        },
      });

      if (def.components && def.components.length > 0) {
        for (let i = 0; i < def.components.length; i++) {
          const comp = def.components[i];
          await prisma.mealComponent.create({
            data: {
              mealId: meal.id,
              name: comp.name,
              quantity: comp.quantity,
              unit: comp.unit,
              sortOrder: i,
            },
          });
        }
      }
    }
  }
  console.log(`  ✓ Created ${itemsToCreate.length} routine items and schedules.`);

  // 6. Healthy Alternatives
  const chanaItem = createdItems.find((i) => i.title === "Boiled Kala Chana Chaat");
  const eggsItem = createdItems.find((i) => i.title.startsWith("Street Snack: 4 Boiled Eggs"));
  if (chanaItem && eggsItem) {
    await prisma.alternative.create({
      data: {
        primaryItemId: chanaItem.id,
        alternativeItemId: eggsItem.id,
        scope: "SNACK",
        conditions: "High protein street swap",
      },
    });
    console.log("  ✓ Configured alternative swap: Kala Chana <-> 4 Boiled Eggs");
  }

  // 7. Generate Occurrences for Today and Upcoming 14 Days
  console.log("  📅 Generating occurrences for next 14 days...");
  const schedules = await prisma.schedule.findMany({
    where: { routineItem: { planId: plan.id } },
    include: { routineItem: true },
  });

  const occurrencesToCreate: Array<{
    scheduleId: string;
    routineItemId: string;
    scheduledDate: Date;
    scheduledTime: string;
    status: "PENDING";
  }> = [];

  for (let offset = 0; offset <= 14; offset++) {
    const curDate = addDays(today, offset);

    for (const s of schedules) {
      if (matchesRecurrence(curDate, s.recurrenceRule)) {
        occurrencesToCreate.push({
          scheduleId: s.id,
          routineItemId: s.routineItemId,
          scheduledDate: curDate,
          scheduledTime: s.scheduledTime,
          status: "PENDING",
        });
      }
    }
  }

  await prisma.occurrence.createMany({
    data: occurrencesToCreate,
    skipDuplicates: true,
  });
  console.log(`  ✓ Generated ${occurrencesToCreate.length} occurrences matching 7-day schedule.`);

  console.log("🎉 Database reset & new 7-Day diet seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
