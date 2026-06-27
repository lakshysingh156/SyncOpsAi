import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ type, message, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor =
    type === "success"
      ? "bg-ok/10 border-ok/30"
      : type === "error"
        ? "bg-danger/10 border-danger/30"
        : "bg-accent/10 border-accent/30";

  const textColor =
    type === "success"
      ? "text-ok"
      : type === "error"
        ? "text-danger"
        : "text-accent";

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 max-w-sm",
        bgColor
      )}
    >
      <span className={cn("text-sm font-medium", textColor)}>{message}</span>
      <button
        onClick={onClose}
        className="ml-auto text-muted hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastState {
  id: string;
  type: ToastType;
  message: string;
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  const add = React.useCallback((type: ToastType, message: string) => {
    const id = String(toastId++);
    setToasts((prev) => [...prev, { id, type, message }]);
    return id;
  }, []);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = React.useCallback((message: string) => add("success", message), [add]);
  const error = React.useCallback((message: string) => add("error", message), [add]);
  const info = React.useCallback((message: string) => add("info", message), [add]);

  return { toasts, add, remove, success, error, info };
}
