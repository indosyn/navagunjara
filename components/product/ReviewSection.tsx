/**
 * Product review list with submission form.
 *
 * @component ReviewSection
 * @author Anurag Muthyam
 * @organization indosyn
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";

interface Review {
  id: string;
  customerName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

interface ReviewSectionProps {
  productId: string;
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/reviews?productId=${productId}`);
      const json = await res.json();
      if (json.success) {
        setReviews(json.data.content);
        setSummary(json.data.summary);
      }
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(productId),
          rating,
          title: title || undefined,
          comment: comment || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message);
        return;
      }
      setShowForm(false);
      setRating(0);
      setTitle("");
      setComment("");
      loadReviews();
    } catch {
      setError("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded" />;

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Reviews {summary ? `(${summary.totalReviews})` : ""}
        </h2>
        {session?.user.role === "USER" && !showForm && (
          <Button onClick={() => setShowForm(true)} size="sm">
            Write a Review
          </Button>
        )}
      </div>

      {/* Summary */}
      {summary && summary.totalReviews > 0 && (
        <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-700">
              {summary.averageRating.toFixed(1)}
            </div>
            <StarRating rating={summary.averageRating} size="md" />
            <div className="text-sm text-gray-500 mt-1">
              {summary.totalReviews} review{summary.totalReviews !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star] ?? 0;
              const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{star}</span>
                  <span className="text-amber-500">★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-500 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-white">
          <h3 className="font-semibold mb-3">Your Review</h3>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Rating *</label>
            <StarRating rating={rating} interactive onRate={setRating} size="lg" />
          </div>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Summarize your experience"
              maxLength={255}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              rows={4}
              placeholder="Tell others about your experience"
              maxLength={2000}
            />
          </div>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} size="sm">
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={review.rating} size="sm" />
                {review.title && (
                  <span className="font-medium text-sm">{review.title}</span>
                )}
              </div>
              {review.comment && (
                <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
              )}
              <div className="text-xs text-gray-400">
                {review.customerName} · {new Date(review.createdAt).toLocaleDateString("en-IN")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
