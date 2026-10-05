import { prisma } from "../src/db";

async function run() {
  console.log("=== Testing User Management & Profile System ===");

  const authCookie = `schedulfy_session=${encodeURIComponent(JSON.stringify({ userId: "admin_test", role: "USER" }))}`;

  try {
    // 1. Update Display Names (Admin & Mom)
    const resProfile = await fetch("http://localhost:4000/api/settings/profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
      },
      body: JSON.stringify({
        adminName: "Vrund",
        momName: "Maa",
      }),
    });
    const profileJson = await resProfile.json();
    console.log("1. Update Profile Names:", profileJson.adminName === "Vrund" && profileJson.momName === "Maa" ? "PASS ✅" : "FAIL ❌", profileJson);

    // 2. Fetch Users Settings
    const resGet = await fetch("http://localhost:4000/api/settings/users", {
      headers: { Cookie: authCookie },
    });
    const getJson = await resGet.json();
    console.log("2. GET /api/settings/users:", getJson.adminName === "Vrund" ? "PASS ✅" : "FAIL ❌", {
      adminName: getJson.adminName,
      momName: getJson.momName,
      userCount: getJson.users?.length,
    });

    // 3. Create User with Invalid Admin PIN (should fail 403)
    const resInvalid = await fetch("http://localhost:4000/api/settings/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
      },
      body: JSON.stringify({
        adminPin: "0000",
        name: "Hacker",
        pin: "9999",
      }),
    });
    console.log("3. Reject Invalid Admin PIN:", resInvalid.status === 403 ? "PASS ✅" : "FAIL ❌");

    // 4. Create User with Valid Admin PIN & Default 1600 Calories
    const resCreate = await fetch("http://localhost:4000/api/settings/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
      },
      body: JSON.stringify({
        adminPin: "1234",
        name: "Rahul",
        pin: "9876",
        calorieTarget: 1600,
        proteinTarget: 130,
        stepsTarget: 8000,
      }),
    });
    const createJson = await resCreate.json();
    console.log("4. Create User with 1600 kcal Default:", createJson.success && createJson.user?.calorieTarget === 1600 ? "PASS ✅" : "FAIL ❌", {
      userName: createJson.user?.name,
      userPin: createJson.user?.pin,
      calorieTarget: createJson.user?.calorieTarget,
    });

    // 5. Test Login with New User's PIN
    const resUserLogin = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "9876" }),
    });
    const userLoginJson = await resUserLogin.json();
    console.log("5. Login with New User PIN:", userLoginJson.success && userLoginJson.name === "Rahul" && userLoginJson.calorieTarget === 1600 ? "PASS ✅" : "FAIL ❌", {
      name: userLoginJson.name,
      role: userLoginJson.role,
      calorieTarget: userLoginJson.calorieTarget,
    });

    // 6. Test Login with Admin PIN
    const resAdminLogin = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "1234" }),
    });
    const adminLoginJson = await resAdminLogin.json();
    console.log("6. Login with Admin PIN:", adminLoginJson.name === "Vrund" ? "PASS ✅" : "FAIL ❌", {
      name: adminLoginJson.name,
      role: adminLoginJson.role,
    });

    // 7. Test Login with Mom PIN
    const resMomLogin = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "5678" }),
    });
    const momLoginJson = await resMomLogin.json();
    console.log("7. Login with Mom PIN:", momLoginJson.name === "Maa" && momLoginJson.role === "MOM" ? "PASS ✅" : "FAIL ❌", {
      name: momLoginJson.name,
      role: momLoginJson.role,
    });

    // 8. Clean up test user
    if (createJson.user?.id) {
      const resDelete = await fetch(`http://localhost:4000/api/settings/users/${createJson.user.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Cookie: authCookie,
          "x-admin-pin": "1234",
        },
      });
      const delJson = await resDelete.json();
      console.log("8. Clean up Test User:", delJson.success ? "PASS ✅" : "FAIL ❌");
    }
  } catch (err) {
    console.error("Test error:", err);
  }

  await prisma.$disconnect();
}

run().catch(console.error);
