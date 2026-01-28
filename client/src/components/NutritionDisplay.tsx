import { cn } from "@/lib/utils";

interface NutritionDisplayProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  className?: string;
}

const items = [
  { key: "calories", label: "Cal", valueKey: "calories" as const },
  { key: "protein", label: "P", valueKey: "protein" as const },
  { key: "carbs", label: "C", valueKey: "carbs" as const },
  { key: "fat", label: "F", valueKey: "fat" as const },
];

export function NutritionDisplay({
  calories,
  protein,
  carbs,
  fat,
  className,
}: NutritionDisplayProps) {
  const values = { calories, protein, carbs, fat };
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        className
      )}
    >
      {items.map(({ key, label, valueKey }) => (
        <span
          key={key}
          className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground"
        >
          {label} {values[valueKey]}
        </span>
      ))}
    </div>
  );
}
