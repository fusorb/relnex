// src/components/shared/Footer.tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Relnex Node Engine Inc. All
          structural graph models reserved.
        </p>
        <div className="flex space-x-6 text-xs text-muted-foreground">
          <Link href="#" className="hover:text-foreground">
            Privacy Isolation
          </Link>
          <Link href="#" className="hover:text-foreground">
            Terms of Matrix
          </Link>
          <Link href="/api-docs" className="hover:text-foreground">
            API Contract Schema
          </Link>
        </div>
      </div>
    </footer>
  );
}
