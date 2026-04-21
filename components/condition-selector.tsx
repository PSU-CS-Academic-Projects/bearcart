"use client";

import { cn } from "@/lib/utils";

const conditions = [
  {
    value: "new",
    label: "New",
    description: "Brand new, unused item",
  },
  {
    value: "like-new",
    label: "Like New",
    description: "Used once or twice, excellent condition",
  },
  {
    value: "good",
    label: "Good",
    description: "Normal wear, fully functional",
  },
  {
    value: "fair",
    label: "Fair",
    description: "Visible wear but still works",
  },
];

interface ConditionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ConditionSelector({
  value,
  onChange,
  error,
}: ConditionSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {conditions.map((condition) => (
          <button
            key={condition.value}
            type="button"
            onClick={() => onChange(condition.value)}
            className={cn(
              "flex flex-col items-center rounded-lg border p-3 text-center transition-colors",
              value === condition.value
                ? "border-primary bg-primary/5 ring-2 ring-primary"
                : error
                  ? "border-destructive"
                  : "border-border hover:border-primary hover:bg-muted/50"
            )}
          >
            <span
              className={cn(
                "text-sm font-medium",
                value === condition.value ? "text-primary" : "text-foreground"
              )}
            >
              {condition.label}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {condition.description}
            </span>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
