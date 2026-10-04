import { PrismaClient } from "@prisma/client";
import { todayUtc, addDays } from "../src/dates";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Schedulfy database...");

  // 1. Users
  const user = await prisma.user.upsert({
    where: { role: "USER" },
    update: {},
    create: { role: "USER" },
  });
  console.log(`  ✓ User created: ${user.id} (${user.role})`);

  const mom = await prisma.user.upsert({
    where: { role: "MOM" },
    update: {},
    create: { role: "MOM" },
  });
  console.log(`  ✓ Mom created: ${mom.id} (${mom.role})`);

  // 2. Active Plan
  let plan = await prisma.plan.findFirst({
    where: { name: "Daily Nutrition & Fitness Routine" },
  });

  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: "Daily Nutrition & Fitness Routine",
        category: "DAILY_OS",
        status: "ACTIVE",
      },
    });
    console.log(`  ✓ Plan created: ${plan.name}`);
  }

  const today = todayUtc();
  const effectiveStartDate = addDays(today, -10);

  // Helper for routine items
  async function upsertItem(
    title: string,
    category: "MEAL" | "WORKOUT" | "SUPPLEMENT" | "ACTIVITY" | "HYDRATION" | "OTHER",
    time: string,
    macros?: { calories?: number; protein?: number; carbs?: number; fat?: number },
    mealData?: {
      mealType: "BREAKFAST" | "LUNCH" | "SNACK" | "DINNER" | "BEDTIME";
      components: Array<{ name: string; quantity?: string; unit?: string }>;
    },
    isAlternative = false
  ) {
    let item = await prisma.routineItem.findFirst({
      where: { planId: plan!.id, title },
    });

    if (!item) {
      item = await prisma.routineItem.create({
        data: {
          planId: plan!.id,
          title,
          category,
        },
      });

      // Only primary items have recurring schedules
      if (!isAlternative) {
        await prisma.schedule.create({
          data: {
            routineItemId: item.id,
            recurrenceRule: "DAILY",
            scheduledTime: time,
            effectiveFrom: effectiveStartDate,
          },
        });
      }

      // Planned nutrition
      if (macros) {
        await prisma.nutritionSnapshot.create({
          data: {
            routineItemId: item.id,
            source: "PLANNED",
            ...macros,
          },
        });
      }

      // Meal & components
      if (mealData) {
        const meal = await prisma.meal.create({
          data: {
            routineItemId: item.id,
            mealType: mealData.mealType,
          },
        });

        for (let i = 0; i < mealData.components.length; i++) {
          const comp = mealData.components[i];
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

    return item;
  }

  // 6 Primary routine items
  const proats = await upsertItem(
    "Chocolate Proats",
    "MEAL",
    "10:15",
    { calories: 380, protein: 32, carbs: 45, fat: 8 },
    {
      mealType: "BREAKFAST",
      components: [
        { name: "Rolled Oats", quantity: "50", unit: "g" },
        { name: "Whey Protein", quantity: "1", unit: "scoop" },
        { name: "Almond Milk", quantity: "200", unit: "ml" },
      ],
    }
  );

  const wheyAlt = await upsertItem(
    "Whey & Banana Shake",
    "MEAL",
    "10:15",
    { calories: 250, protein: 30, carbs: 25, fat: 3 },
    undefined,
    true // isAlternative
  );

  await upsertItem(
    "Lunch",
    "MEAL",
    "12:30",
    { calories: 420, protein: 14, carbs: 55, fat: 12 },
    {
      mealType: "LUNCH",
      components: [
        { name: "Phulkas", quantity: "2", unit: "pcs" },
        { name: "Cabbage-Capsicum Sabzi", quantity: "1", unit: "bowl" },
        { name: "Fresh Salad", quantity: "1", unit: "plate" },
        { name: "Dahi / Curd", quantity: "150", unit: "g" },
      ],
    }
  );

  const chana = await upsertItem(
    "Kala Chana",
    "MEAL",
    "17:30",
    { calories: 180, protein: 10, carbs: 28, fat: 3 },
    {
      mealType: "SNACK",
      components: [{ name: "Boiled Kala Chana", quantity: "100", unit: "g" }],
    }
  );

  const eggsAlt = await upsertItem(
    "3 Boiled Eggs",
    "MEAL",
    "17:30",
    { calories: 210, protein: 18, carbs: 2, fat: 15 },
    undefined,
    true // isAlternative
  );

  await upsertItem(
    "Dinner",
    "MEAL",
    "19:00",
    { calories: 450, protein: 22, carbs: 35, fat: 20 },
    {
      mealType: "DINNER",
      components: [
        { name: "Paneer Bhurji", quantity: "100", unit: "g" },
        { name: "Phulkas", quantity: "2", unit: "pcs" },
        { name: "Green Salad", quantity: "1", unit: "bowl" },
      ],
    }
  );

  await upsertItem("1-hour Evening Walk", "WORKOUT", "20:00");

  await upsertItem(
    "Warm Turmeric Milk",
    "MEAL",
    "23:30",
    { calories: 120, protein: 4, carbs: 10, fat: 5 },
    {
      mealType: "BEDTIME",
      components: [{ name: "Warm Milk with Turmeric", quantity: "200", unit: "ml" }],
    }
  );

  // Clean any accidental schedules on alternatives
  await prisma.schedule.deleteMany({
    where: { routineItemId: { in: [wheyAlt.id, eggsAlt.id] } },
  });

  // 3. Alternative links
  await prisma.alternative.upsert({
    where: {
      primaryItemId_alternativeItemId: {
        primaryItemId: proats.id,
        alternativeItemId: wheyAlt.id,
      },
    },
    update: {},
    create: {
      primaryItemId: proats.id,
      alternativeItemId: wheyAlt.id,
      scope: "BREAKFAST",
    },
  });

  await prisma.alternative.upsert({
    where: {
      primaryItemId_alternativeItemId: {
        primaryItemId: chana.id,
        alternativeItemId: eggsAlt.id,
      },
    },
    update: {},
    create: {
      primaryItemId: chana.id,
      alternativeItemId: eggsAlt.id,
      scope: "SNACK",
    },
  });
  console.log("  ✓ Alternatives configured");

  // 4. Generate occurrences using todayUtc()
  const schedules = await prisma.schedule.findMany({
    include: { routineItem: true },
  });

  for (let offset = -4; offset <= 7; offset++) {
    const dayDate = addDays(today, offset);

    for (const sched of schedules) {
      let occ = await prisma.occurrence.findUnique({
        where: {
          scheduleId_scheduledDate: {
            scheduleId: sched.id,
            scheduledDate: dayDate,
          },
        },
      });

      if (!occ) {
        let status: "PENDING" | "COMPLETED" | "SKIPPED" | "MISSED" | "REPLACED" = "PENDING";
        if (offset < 0) {
          status = offset === -2 && sched.routineItem.title === "Kala Chana" ? "SKIPPED" : "COMPLETED";
        } else if (offset === 0) {
          // Today: breakfast completed, rest pending
          if (sched.routineItem.title === "Chocolate Proats") {
            status = "COMPLETED";
          }
        }

        occ = await prisma.occurrence.create({
          data: {
            scheduleId: sched.id,
            routineItemId: sched.routineItemId,
            scheduledDate: dayDate,
            scheduledTime: sched.scheduledTime,
            status,
          },
        });

        if (status === "COMPLETED") {
          await prisma.completion.upsert({
            where: { occurrenceId: occ.id },
            update: {},
            create: {
              occurrenceId: occ.id,
              status: "COMPLETED",
            },
          });
        }
      }
    }
  }

  console.log("  ✓ Occurrences & completions populated with todayUtc() timezone alignment");
  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
