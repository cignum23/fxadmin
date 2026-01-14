import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl text-muted-foreground mb-8">Page not found</p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
