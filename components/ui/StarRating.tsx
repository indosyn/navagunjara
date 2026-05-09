/**
 * Star rating display component.
 *
 * @component StarRating
 * @author Anurag Muthyam
 * @organization indosyn
 */

"use client";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = "md",
  interactive = false,
  onRate,
}: StarRatingProps) {
  const sizeClass = { sm: "text-sm", md: "text-lg", lg: "text-2xl" }[size];

  return (
    <div className={`flex gap-0.5 ${sizeClass}`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= Math.round(rating);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(starValue)}
            className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform ${
              filled ? "text-amber-500" : "text-gray-300"
            }`}
            aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
