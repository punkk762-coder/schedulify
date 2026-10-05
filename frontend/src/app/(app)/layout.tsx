import { requireUser } from "@/lib/auth";
import BottomNav from "./BottomNav";
import DesktopHeader from "./DesktopHeader";
import MobileHeader from "./MobileHeader";
import { ToastProvider } from "@/components/ui/Toast";
import { FloatingMobileAiIsland } from "@/components/chat/FloatingMobileAiIsland";
import { AlarmManager } from "@/components/alarm/AlarmManager";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce USER session on server
  await requireUser();

  return (
    <ToastProvider>
      <AlarmManager />
      <div className="min-h-screen text-[#1f1b14] flex flex-col justify-between pb-24 lg:pb-8">
        {/* Desktop Command Navigation Bar (lg+) */}
        <DesktopHeader />

        {/* Mobile Top Navigation Header (< lg) */}
        <MobileHeader />

        {/* Main Content Area: Wide, Panoramic & Spacious (max-w-7xl) */}
        <main className="max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-8 flex-1 transition-all duration-300">
          {children}
        </main>

        {/* Mobile Floating iPhone Dynamic Island AI Chat (< lg) */}
        <FloatingMobileAiIsland />

        {/* Mobile Bottom Navigation (Hidden on lg+) */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </ToastProvider>
  );
}
