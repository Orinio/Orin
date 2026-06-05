import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({ className, children, hover = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] p-6 transition-all duration-200",
        "bg-[var(--color-surface)] border border-[var(--color-border)]",
        "shadow-soft-sm",
        hover && "hover:shadow-soft-lg hover:-translate-y-0.5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
