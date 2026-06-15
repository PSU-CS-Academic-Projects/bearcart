import { cn } from "@/lib/utils";

export function OnboardingSteps({ active }: { active: 1 | 2 }) {
  const step = (n: 1 | 2, label: string) => {
    const isActive = active === n;
    return (
      <span className={cn("flex items-center gap-1.5", isActive ? "text-primary" : "text-muted-foreground")}>
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full text-[0.65rem] font-semibold",
            isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {n}
        </span>
        {label}
      </span>
    );
  };

  return (
    <div className="mb-6 flex items-center justify-center gap-2 text-xs font-medium">
      {step(1, "Setup")}
      <span className="text-muted-foreground">→</span>
      {step(2, "Terms")}
    </div>
  );
}
