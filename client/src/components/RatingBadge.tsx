import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-2 py-0.5 gap-1 [&_svg]:size-3",
  md: "text-sm px-2.5 py-1 gap-1.5 [&_svg]:size-4",
  lg: "text-base px-3 py-1.5 gap-2 [&_svg]:size-5",
};

interface RatingBadgeProps {
  rating: number;
  size?: Size;
  className?: string;
}

export function RatingBadge({ rating, size = "md", className }: RatingBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-primary/20 text-primary font-semibold border border-primary/30",
        sizeClasses[size],
        className
      )}
    >
      <Trophy className="shrink-0" />
      <span>{rating}</span>
    </span>
  );
}
