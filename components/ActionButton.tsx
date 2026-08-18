import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variantClass: Record<Variant, string> = {
  primary:
    "bg-foreground text-background hover:bg-neutral-800 focus-visible:outline-offset-2",
  secondary:
    "border border-neutral-300 bg-transparent text-foreground hover:border-neutral-400 hover:bg-neutral-100/80",
  ghost:
    "text-muted hover:text-foreground",
};

export function ActionButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={`min-h-12 w-full px-5 text-[15px] tracking-[0.02em] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
