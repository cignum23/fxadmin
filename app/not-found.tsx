import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <h1 className="text-6xl font-bold text-white mb-4">404</h1>
      <p className="text-2xl text-slate-300 mb-8">Page not found</p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
