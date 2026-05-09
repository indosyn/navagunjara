const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  CONFIRMED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  SHIPPED: "bg-purple-50 text-purple-700 ring-purple-600/20",
  DELIVERED: "bg-green-50 text-green-700 ring-green-600/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
  JEWELRY: "bg-amber-50 text-amber-700 ring-amber-600/20",
  CLOTHING: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
};

interface BadgeProps {
  label: string;
  className?: string;
}

export function Badge({ label, className = "" }: BadgeProps) {
  const color = statusColors[label] ?? "bg-gray-50 text-gray-700 ring-gray-600/20";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${color} ${className}`}
    >
      {label}
    </span>
  );
}
