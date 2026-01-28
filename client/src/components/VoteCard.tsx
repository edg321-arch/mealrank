import { motion } from "framer-motion";
import { RatingBadge } from "@/components/RatingBadge";
import { NutritionDisplay } from "@/components/NutritionDisplay";
import { imageSrc } from "@/lib/images";
import { cn } from "@/lib/utils";

interface VoteCardProps {
  meal: {
    id: number;
    name: string;
    rating: number;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    images?: { id: number; imageType: string; imageUrl?: string | null; imageData?: string | null; mimeType?: string | null }[];
  };
  delta?: number | null;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function VoteCard({
  meal,
  delta,
  onClick,
  disabled,
  className,
}: VoteCardProps) {
  const img = meal.images?.[0];
  const src = img ? imageSrc(img) : null;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col rounded-2xl overflow-hidden border-2 border-transparent bg-card text-left shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-colors",
        !disabled && "hover:border-primary/50 hover:shadow-xl cursor-pointer active:scale-[0.98]",
        disabled && "cursor-not-allowed opacity-80",
        className
      )}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="aspect-[4/3] bg-muted relative">
        {src ? (
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-6xl">🍽</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <RatingBadge rating={meal.rating} size="md" />
        </div>
        {delta != null && delta !== 0 && (
          <motion.span
            className={cn(
              "absolute bottom-2 left-2 right-2 text-center font-bold text-lg py-1 rounded-lg",
              delta > 0 ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
            )}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {delta > 0 ? `+${delta} 🎉` : delta}
          </motion.span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg truncate">{meal.name}</h3>
        <NutritionDisplay
          calories={meal.totalCalories}
          protein={meal.totalProtein}
          carbs={meal.totalCarbs}
          fat={meal.totalFat}
        />
      </div>
    </motion.button>
  );
}
