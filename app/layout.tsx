// app/layout.tsx
import "./globals.css";
import "@fontsource-variable/inter";
import { AuthProvider } from "@/lib/auth-context";

export const metadata = {
  title: "FX Admin",
  description: "Internal USD/NGN FX rate engine and crypto market administration.",
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
