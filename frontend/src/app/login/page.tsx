"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitPin = useCallback(async (codeToSubmit: string) => {
    if (codeToSubmit.length < 4 || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: codeToSubmit }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Incorrect PIN");
        setPin("");
        setLoading(false);
        return;
      }

      router.push(data.redirectTo || "/today");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setPin("");
      setLoading(false);
    }
  }, [loading, router]);

  const handleDigit = useCallback(
    (digit: string) => {
      if (loading) return;
      if (pin.length < 10) {
        const nextPin = pin + digit;
        setPin(nextPin);
        setError(null);
        if (nextPin.length === 4) {
          handleSubmitPin(nextPin);
        }
      }
    },
    [loading, pin, handleSubmitPin]
  );

  const handleBackspace = useCallback(() => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  }, [loading]);

  const handleClear = useCallback(() => {
    if (loading) return;
    setPin("");
    setError(null);
  }, [loading]);

  // Keyboard support for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Enter" && pin.length >= 4) {
        handleSubmitPin(pin);
      } else if (e.key === "Escape") {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, loading, handleSubmitPin, handleDigit, handleBackspace, handleClear]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-6 bg-[#fff8f2] text-[#1f1b14]">
      {/* Brand Header */}
      <div className="w-full max-w-xs text-center pt-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] text-[#a43716] mb-4 shadow-sm">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-[#1f1b14]">Schedulfy</h1>
        <p className="text-xs text-[#58423c] mt-1 font-medium">Mediterranean Routine Protocol</p>
      </div>

      {/* PIN Input & Dot indicators */}
      <div className="w-full max-w-xs flex flex-col items-center my-auto">
        <p className="text-xs font-bold uppercase tracking-wider text-[#8b716a] mb-6">Enter Access PIN</p>

        {/* PIN dots (4 primary dots) */}
        <div className="flex items-center gap-4 mb-4">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? "bg-[#a43716] scale-110 shadow-sm"
                    : "bg-[#eae1d5] border border-[#dfc0b7]"
                }`}
              />
            );
          })}
        </div>

        {/* Status / Error message */}
        <div className="h-6 flex items-center justify-center">
          {error && <span className="text-xs text-[#ba1a1a] font-medium animate-pulse">{error}</span>}
          {loading && <span className="text-xs text-[#a43716] font-medium animate-pulse">Verifying PIN...</span>}
        </div>

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-3 w-full mt-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              disabled={loading}
              className="h-16 rounded-2xl bg-white text-2xl font-serif font-semibold text-[#1f1b14] active:scale-95 active:bg-[#fcf2e6] transition-all flex items-center justify-center border border-[#dfc0b7] hover:border-[#a43716]/50 shadow-xs"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            disabled={loading || pin.length === 0}
            className="h-16 rounded-2xl bg-white text-xs font-bold text-[#8b716a] active:scale-95 transition-all flex items-center justify-center border border-[#dfc0b7] hover:text-[#1f1b14] shadow-xs"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleDigit("0")}
            disabled={loading}
            className="h-16 rounded-2xl bg-white text-2xl font-serif font-semibold text-[#1f1b14] active:scale-95 active:bg-[#fcf2e6] transition-all flex items-center justify-center border border-[#dfc0b7] hover:border-[#a43716]/50 shadow-xs"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            disabled={loading || pin.length === 0}
            className="h-16 rounded-2xl bg-white text-lg text-[#8b716a] active:scale-95 transition-all flex items-center justify-center border border-[#dfc0b7] hover:text-[#1f1b14] shadow-xs"
          >
            ⌫
          </button>
        </div>

        {/* Manual submit button if pin length > 4 */}
        {pin.length > 4 && (
          <button
            type="button"
            onClick={() => handleSubmitPin(pin)}
            disabled={loading}
            className="w-full mt-4 py-3 rounded-full bg-[#a43716] hover:bg-[#862201] font-semibold text-white shadow-xs active:scale-98 transition-all"
          >
            Submit PIN
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-xs text-center pb-4">
        <p className="text-xs text-[#8b716a]">USER (1234) • MOM (5678)</p>
      </div>
    </main>
  );
}
