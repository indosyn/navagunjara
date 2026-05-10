export function LoadingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden"
        >
          <div className="aspect-square animate-shimmer" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-100 rounded-full w-3/4" />
            <div className="h-3 bg-gray-100 rounded-full w-1/2" />
            <div className="h-5 bg-gray-100 rounded-full w-1/3" />
            <div className="h-9 bg-gray-100 rounded-lg w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
