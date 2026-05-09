"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium border border-[var(--color-border)] bg-white hover:bg-[var(--color-surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Previous
      </button>
      <span className="text-sm text-[var(--color-muted)] px-3">
        Page <span className="font-semibold text-[var(--color-foreground)]">{page + 1}</span> of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page + 1 >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium border border-[var(--color-border)] bg-white hover:bg-[var(--color-surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Next
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </nav>
  );
}
