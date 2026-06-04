"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Status = "checking" | "ok" | "down";

export function HealthBadge() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/backend/health")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => !cancelled && setStatus("ok"))
      .catch(() => !cancelled && setStatus("down"));
    return () => {
      cancelled = true;
    };
  }, []);

  const label =
    status === "ok"
      ? "Backend connected"
      : status === "down"
        ? "Backend unreachable"
        : "Checking backend…";

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          status === "ok" && "bg-ok",
          status === "down" && "bg-danger",
          status === "checking" && "animate-pulse bg-warn",
        )}
      />
      {label}
    </span>
  );
}
