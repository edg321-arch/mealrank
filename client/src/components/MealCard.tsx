import { Link } from "wouter";
import { motion } from "framer-motion";
import { RatingBadge } from "@/components/RatingBadge";
import { imageSrc } from "@/lib/images";
import { cn } from "@/lib/utils";

interface MealCardProps {
  meal: {
    id: number;
    name: string;
    rating: number;
    images?: { id: number; imageType: string; imageUrl?: string | null; imageData?: string | null; mimeType?: string | null }[];
  };
  className?: string;
}

export function MealCard({ meal, className }: MealCardProps) {
  const img = meal.images?.[0];
  const src = img ? imageSrc(img) : null;

  return (
    <Link href={`/meals/${meal.id}`}>
      <motion.div
        className={cn(
          "block rounded-xl overflow-hidden border bg-card shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background cursor-pointer",
          className
        )}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="aspect-square bg-muted relative">
          {src ? (
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">🍽</span>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <RatingBadge rating={meal.rating} size="sm" />
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm truncate">{meal.name}</h3>
        </div>
      </motion.div>
    </Link>
  );
}
