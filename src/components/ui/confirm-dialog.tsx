"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  loading = false,
  variant = "default",
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: "default" | "dark";
}) {
  if (!open) return null;

  const isDark = variant === "dark";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onCancel}
        disabled={loading}
      />

      <div
        className={cn(
          "relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl",
          isDark
            ? "border-gold/30 bg-black-deep text-white"
            : "border-gold/25 bg-card shadow-gold"
        )}
      >
        <div
          className={cn(
            "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full",
            isDark ? "bg-gold/15" : "bg-gold-soft"
          )}
        >
          <LogOut
            className={cn("h-7 w-7", isDark ? "text-gold" : "text-gold-deep")}
          />
        </div>

        <h2
          id="confirm-dialog-title"
          className={cn(
            "text-center font-display text-xl font-semibold",
            isDark ? "text-gold" : "text-foreground"
          )}
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-desc"
          className={cn(
            "mt-2 text-center text-sm leading-relaxed",
            isDark ? "text-white/70" : "text-muted-foreground"
          )}
        >
          {description}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            type="button"
            className="w-full sm:flex-1"
            variant={isDark ? "staff" : "default"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Déconnexion…" : confirmLabel}
          </Button>
          <Button
            type="button"
            className="w-full sm:flex-1"
            variant={isDark ? "staffOutline" : "outline"}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
