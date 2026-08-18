"use client";

import { useState } from "react";
import { IconEye, IconEyeOff } from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";

interface PasswordFieldProps {
  label: string;
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  autoComplete?: string;
}

const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 pr-10 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:text-zinc-200";

export function PasswordField({ label, id, name, value, onChange, error, autoComplete }: PasswordFieldProps) {
  const t = useTranslations();
  const [isVisible, setIsVisible] = useState(false);
  const errorId = error ? `${id}-error` : undefined;

  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label}
      <span className="relative">
        <input
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          autoComplete={autoComplete}
          className={`${FIELD_CLASS} ${error ? "border-red-400 dark:border-red-500/60" : ""}`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          aria-label={isVisible ? t("auth.hidePassword") : t("auth.showPassword")}
          aria-pressed={isVisible}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          {isVisible ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
        </button>
      </span>
      {error && (
        <span id={errorId} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </label>
  );
}
