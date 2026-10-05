"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ManagedUser {
  id: string;
  name: string;
  pin: string;
  role: string;
  calorieTarget: number;
  proteinTarget: number;
  stepsTarget: number;
  waterTargetMl: number;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  // Profile names
  const [adminName, setAdminName] = useState("Vrund");
  const [momName, setMomName] = useState("Mom");
  const [savingNames, setSavingNames] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);

  // User management
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // New user form state
  const [adminPin, setAdminPin] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPin, setNewUserPin] = useState("");
  const [newUserCalories, setNewUserCalories] = useState<number>(1600);
  const [newUserProtein, setNewUserProtein] = useState<number>(130);
  const [newUserSteps, setNewUserSteps] = useState<number>(8000);
  const [creatingUser, setCreatingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch("/api/settings/users");
      if (res.ok) {
        const data = await res.json();
        if (data.adminName) setAdminName(data.adminName);
        if (data.momName) setMomName(data.momName);
        if (data.users) setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const handleSaveNames = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingNames) return;
    setSavingNames(true);
    setNameMessage(null);

    try {
      const res = await fetch("/api/settings/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminName, momName }),
      });
      if (res.ok) {
        const data = await res.json();
        setNameMessage(data.message || "Display names updated successfully!");
        setTimeout(() => setNameMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to save names:", err);
    } finally {
      setSavingNames(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingUser) return;
    setCreatingUser(true);
    setUserError(null);
    setUserSuccess(null);

    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPin,
          name: newUserName,
          pin: newUserPin,
          calorieTarget: newUserCalories,
          proteinTarget: newUserProtein,
          stepsTarget: newUserSteps,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUserSuccess(data.message || `User ${newUserName} created!`);
        setNewUserName("");
        setNewUserPin("");
        setNewUserCalories(1600);
        fetchSettings();
        setTimeout(() => setUserSuccess(null), 4000);
      } else {
        setUserError(data.error || "Failed to create user.");
      }
    } catch (err) {
      console.error("Failed to create user:", err);
      setUserError("Network error while creating user.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const enteredPin = prompt("Enter Admin PIN to confirm user deletion:");
    if (!enteredPin) return;

    try {
      const res = await fetch(`/api/settings/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": enteredPin,
        },
      });

      if (res.ok) {
        fetchSettings();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user.");
      }
    } catch (err) {
      console.error("Delete user error:", err);
    }
  };

  const handleSeedSampleRoutine = async () => {
    setSeeding(true);
    setSeedMessage(null);

    const sampleRoutine = `10:15 AM - Breakfast: Chocolate Proats (50g Oats, 1 scoop Whey, 200ml Almond milk) - 380 kcal, 32g protein, 45g carbs, 8g fat
12:30 PM - Lunch: 2 Phulkas, Cabbage-Capsicum Sabzi, Large Green Salad, 150g Dahi - 420 kcal, 14g protein, 55g carbs, 12g fat
5:30 PM - Evening Snack: Kala Chana (boiled 100g) - 180 kcal, 10g protein, 28g carbs, 3g fat
7:00 PM - Dinner: Paneer Bhurji (100g Paneer), 2 Phulkas, Fresh Salad - 450 kcal, 22g protein, 35g carbs, 20g fat
8:00 PM - 1-hour Evening Walk
11:30 PM - Bedtime: Warm Turmeric Milk / Chamomile - 120 kcal, 4g protein, 10g carbs, 5g fat`;

    try {
      const parseRes = await fetch("/api/plans/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "parse", text: sampleRoutine }),
      });
      const parseData = await parseRes.json();

      if (parseData.proposal) {
        const commitRes = await fetch("/api/plans/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "commit", proposal: parseData.proposal }),
        });
        if (commitRes.ok) {
          setSeedMessage("Default routine loaded! Check your Today screen.");
        }
      }
    } catch (err) {
      console.error("Failed to seed sample routine:", err);
      setSeedMessage("Failed to load sample routine.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="w-full space-y-6 text-[#1f1b14] pb-24">
      {/* Header */}
      <header className="bg-white rounded-2xl p-6 border border-[#dfc0b7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#52652a]">
              Admin Control Panel &amp; Security
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1f1b14]">
            Settings &amp; User Directory
          </h1>
          <p className="text-xs text-[#58423c] mt-0.5">
            Manage profiles, authorize new user accounts with 1,600 kcal defaults, and configure names.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-[#ffdad6] hover:bg-[#ffb5a0] text-[#93000a] border border-[#ba1a1a]/20 text-xs font-bold transition-all active:scale-95 shadow-xs shrink-0"
        >
          Sign Out / Exit
        </button>
      </header>

      {/* ─── Profile Display Names Customization (Admin & Mom) ─── */}
      <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#dfc0b7]">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#a43716] uppercase tracking-wider block">
              Identity Management
            </span>
            <h2 className="text-base font-serif font-bold text-[#1f1b14]">
              Admin &amp; Mom Display Names
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#52652a] font-bold bg-[#f7faef] px-2.5 py-1 rounded-full border border-[#52652a]/20">
            Saved to Database
          </span>
        </div>

        {nameMessage && (
          <p className="text-xs font-semibold text-[#52652a] bg-[#f7faef] p-2.5 rounded-xl border border-[#52652a]/20">
            {nameMessage}
          </p>
        )}

        <form onSubmit={handleSaveNames} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
              Admin Name (You)
            </label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="e.g. Vrund"
              className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-bold text-[#1f1b14] bg-[#fcf2e6]/40 focus:bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
              Mom's Name
            </label>
            <input
              type="text"
              value={momName}
              onChange={(e) => setMomName(e.target.value)}
              placeholder="e.g. Mom or Maa"
              className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-bold text-[#1f1b14] bg-[#fcf2e6]/40 focus:bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={savingNames}
              className="px-5 py-2 rounded-xl bg-[#a43716] hover:bg-[#862201] text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-40 shadow-xs flex items-center gap-1.5"
            >
              {savingNames ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Names...</span>
                </>
              ) : (
                <>
                  <span>Save Profile Names</span>
                  <span>✓</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Create New User Panel (Admin Verified via ENV PIN) ─── */}
      <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-linear-to-br from-white via-[#fcf2e6]/30 to-white shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#dfc0b7]">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#a43716] uppercase tracking-wider block">
              User Creation Engine
            </span>
            <h2 className="text-base font-serif font-bold text-[#1f1b14]">
              Add New User (Admin Authorized)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#a43716] font-bold bg-[#ffdbd1] px-2.5 py-1 rounded-full border border-[#a43716]/20">
            1,600 kcal Default Target
          </span>
        </div>

        <p className="text-xs text-[#58423c]">
          Enter your Admin PIN (from environment) to register a new user. The user will be initialized with a standard <strong>1,600 calorie</strong> deficit target, personal PIN access, and dedicated routine tracking.
        </p>

        {userError && (
          <p className="text-xs font-semibold text-[#93000a] bg-[#ffdad6] p-2.5 rounded-xl border border-[#ba1a1a]/20">
            {userError}
          </p>
        )}

        {userSuccess && (
          <p className="text-xs font-semibold text-[#52652a] bg-[#f7faef] p-2.5 rounded-xl border border-[#52652a]/20">
            {userSuccess}
          </p>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
                Admin ENV PIN *
              </label>
              <input
                type="password"
                maxLength={10}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Admin PIN (e.g. 1234)"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-mono font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
                New User Name *
              </label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. Rahul or Priya"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
                New User Login PIN *
              </label>
              <input
                type="text"
                maxLength={6}
                value={newUserPin}
                onChange={(e) => setNewUserPin(e.target.value)}
                placeholder="4-digit Login PIN"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-mono font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
                Daily Calorie Limit (kcal)
              </label>
              <input
                type="number"
                value={newUserCalories}
                onChange={(e) => setNewUserCalories(parseInt(e.target.value, 10) || 1600)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-mono font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
              />
              <span className="text-[10px] text-[#52652a] font-medium block mt-0.5">
                Default: 1,600 kcal
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
                Protein Target (g)
              </label>
              <input
                type="number"
                value={newUserProtein}
                onChange={(e) => setNewUserProtein(parseInt(e.target.value, 10) || 130)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-mono font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
                Daily Steps Target
              </label>
              <input
                type="number"
                step="500"
                value={newUserSteps}
                onChange={(e) => setNewUserSteps(parseInt(e.target.value, 10) || 8000)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-mono font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creatingUser}
              className="px-6 py-2.5 rounded-xl bg-[#52652a] hover:bg-[#3b4d14] text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-40 shadow-xs flex items-center gap-2"
            >
              {creatingUser ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating User...</span>
                </>
              ) : (
                <>
                  <span>Create User Account</span>
                  <span>➕</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Managed Users Directory Roster ─── */}
      <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#dfc0b7]">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#8b716a] uppercase tracking-wider block">
              Active Accounts
            </span>
            <h2 className="text-base font-serif font-bold text-[#1f1b14]">
              Registered Users Directory ({users.length})
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#58423c]">
            Multi-User Isolation
          </span>
        </div>

        {loadingUsers ? (
          <div className="p-4 text-center text-xs text-[#8b716a] animate-pulse">
            Loading managed accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#fcf2e6]/50 border border-[#dfc0b7] text-center space-y-1">
            <p className="text-xs font-bold text-[#1f1b14]">No managed users created yet</p>
            <p className="text-[11px] text-[#58423c]">
              Use the form above with your Admin PIN to create user accounts with 1,600 calorie defaults.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-xl border border-[#dfc0b7] bg-[#fcf2e6]/30 flex items-center justify-between shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#1f1b14]">{u.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#d4eca2] text-[#3b4d14] text-[9px] font-mono font-bold uppercase">
                      {u.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#58423c] flex items-center gap-2">
                    <span>🔥 {u.calorieTarget} kcal</span>
                    <span>•</span>
                    <span>🥩 {u.proteinTarget}g Protein</span>
                    <span>•</span>
                    <span>🚶 {u.stepsTarget.toLocaleString()} steps</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8b716a]">
                    PIN: •••• (Registered: {new Date(u.createdAt).toLocaleDateString()})
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteUser(u.id)}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-[#ba1a1a] hover:bg-[#ffdad6] transition-all"
                  title="Remove user"
                >
                  Delete ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid Settings: Role & Routine Initialization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-4">
          <span className="text-[10px] font-mono font-bold text-[#8b716a] uppercase tracking-wider block">
            Session &amp; Security
          </span>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#58423c] font-medium">Session Role</span>
            <span className="px-3 py-1 rounded-full bg-[#fcf2e6] text-[#a43716] border border-[#dfc0b7] font-bold font-mono text-[11px]">
              PRIMARY ADMIN
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#dfc0b7]/50">
            <span className="text-[#58423c] font-medium">Active Timezone</span>
            <span className="text-[#1f1b14] font-mono font-semibold">Asia/Kolkata</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#dfc0b7]/50">
            <span className="text-[#58423c] font-medium">Database Persistence</span>
            <span className="text-[#52652a] font-mono font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#52652a]" />
              Supabase IPv4 Pooler
            </span>
          </div>
        </div>

        {/* Demo & Routine Loader */}
        <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-4">
          <span className="text-[10px] font-mono font-bold text-[#8b716a] uppercase tracking-wider block">
            Protocol Initialization
          </span>
          <p className="text-xs text-[#58423c]">
            One-click reloads the complete Mediterranean Routine (Proats, Lunch, Kala Chana, Dinner, Evening Walk, Bedtime Milk).
          </p>

          {seedMessage && (
            <p className="text-xs font-semibold text-[#52652a] animate-pulse bg-[#f7faef] p-2 rounded-xl border border-[#52652a]/20">
              {seedMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleSeedSampleRoutine}
            disabled={seeding}
            className="w-full py-2.5 rounded-xl bg-[#a43716] hover:bg-[#862201] text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-40 shadow-xs"
          >
            {seeding ? "Importing Routine..." : "Load Default 7-Day Routine"}
          </button>
        </div>

        {/* Clean Data & AI Protocol Calibration */}
        <div className="p-6 rounded-2xl border border-[#ffdad6] bg-linear-to-br from-white to-[#fff8f6] shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#ba1a1a] uppercase tracking-wider block">
              Protocol Reset &amp; AI Calibration Flow
            </span>
            <span className="text-[10px] font-mono text-[#8b716a]">Clean &amp; Re-import</span>
          </div>

          <p className="text-xs text-[#58423c]">
            Cleans active routine data and directly initiates the <strong>AI Coach Studio</strong>. You can set your daily calorie limit (e.g. 1600 or 1800 kcal), paste raw plans from ChatGPT or Claude, review AI-selected foundations, and answer questions or write custom instructions.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("Clean active protocol data and launch AI Chat Intake?")) {
                  try {
                    await fetch("/api/plans/reset", { method: "POST" });
                  } catch (e) {
                    console.error("Reset error:", e);
                  }
                  router.push("/chat?intake=1");
                }
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center justify-center gap-2"
            >
              <span>🧹</span>
              <span>Clean Data &amp; Start AI Intake</span>
            </button>
            <span className="text-[11px] text-[#8b716a]">
              Directs to AI Chat with Calorie Target selection first
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
