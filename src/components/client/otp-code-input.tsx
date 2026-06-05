"use client";

import { useCallback, useEffect, useRef } from "react";
import { extractOtpFromClipboard } from "@/lib/otp-clipboard";
import { cn } from "@/lib/utils";

function extractDigits(raw: string, max = 6): string {
  return raw.replace(/\D/g, "").slice(0, max);
}

export function OtpCodeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  const setCode = useCallback(
    (next: string) => onChange(extractDigits(next)),
    [onChange]
  );

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function focusAt(index: number) {
    const el = inputsRef.current[Math.max(0, Math.min(5, index))];
    el?.focus();
    el?.select();
  }

  function applyDigits(raw: string, startIndex = 0) {
    const extracted = extractOtpFromClipboard(raw);
    if (extracted) {
      setCode(extracted);
      focusAt(5);
      return;
    }
    const clean = extractDigits(raw);
    if (!clean) return;
    const merged = (value.slice(0, startIndex) + clean).slice(0, 6);
    setCode(merged);
    focusAt(Math.min(merged.length, 5));
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      e.preventDefault();
      const next = value.slice(0, index - 1) + value.slice(index);
      setCode(next);
      focusAt(index - 1);
    }
    if (e.key === "ArrowLeft" && index > 0) focusAt(index - 1);
    if (e.key === "ArrowRight" && index < 5) focusAt(index + 1);
  }

  return (
    <div className="space-y-3">
      {/* iOS / Android : suggestion auto depuis SMS ou WhatsApp */}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => applyDigits(e.target.value)}
      />

      <div className="flex justify-center gap-1.5 sm:gap-2.5" role="group" aria-label="Code à 6 chiffres">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={digit.trim()}
            aria-label={`Chiffre ${index + 1}`}
            className={cn(
              "h-14 w-12 rounded-xl border-2 border-border bg-card text-center text-2xl font-bold tracking-widest text-foreground shadow-sm transition-colors sm:h-16 sm:w-12",
              "focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30",
              digit.trim() && "border-gold bg-gold-soft/50"
            )}
            onChange={(e) => {
              const d = extractDigits(e.target.value);
              if (!d) {
                const next = value.slice(0, index) + value.slice(index + 1);
                setCode(next);
                return;
              }
              const last = d.slice(-1);
              const next =
                value.slice(0, index) + last + value.slice(index + 1);
              setCode(next.slice(0, 6));
              if (index < 5) focusAt(index + 1);
            }}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={(e) => e.target.select()}
            onPaste={(e) => {
              e.preventDefault();
              applyDigits(e.clipboardData.getData("text"), index);
            }}
          />
        ))}
      </div>
    </div>
  );
}
