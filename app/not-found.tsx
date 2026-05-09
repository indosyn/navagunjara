import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-[var(--color-primary)] mb-4">404</p>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">Page Not Found</h1>
        <p className="text-[var(--color-muted)] mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
