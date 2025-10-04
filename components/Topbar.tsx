//components\Topbar.tsx
"use client";

export default function Topbar() {
  return (
    <header className="w-full bg-white border-b px-6 py-3 shadow-sm text-gray-950">
      <input
        type="text"
        placeholder="Search crypto..."
        className="w-full max-w-sm border rounded-md px-3 py-2 text-sm"
      />
    </header>
  );
}
