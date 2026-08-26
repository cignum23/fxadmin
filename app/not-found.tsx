import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
      <div className="rounded-2xl border border-border bg-white/80 p-8 shadow-card">
      <h1 className="mb-4 text-6xl font-extrabold text-primary">404</h1>
      <p className="mb-8 text-2xl font-bold text-[var(--color-text-strong)]">Page not found</p>
      <Link
        href="/"
        className="inline-flex rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,white)]"
      >
        Back to home
      </Link>
      </div>
    </div>
  );
}
