// app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata = {
  title: "Crypto Monitor",
  description: "Live crypto price tracking in USD and NGN",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        {/* AuthProvider MUST be here AND allowed, because this is still a server component */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
