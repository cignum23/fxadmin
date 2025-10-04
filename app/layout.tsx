// //app\layout.tsx
// import "./globals.css";
// import Sidebar from "@/components/Sidebar";
// import Topbar from "@/components/Topbar";

// export const metadata = {
//   title: "Crypto Monitor",
//   description: "Live crypto price tracking in USD and NGN",
// };

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <body className="flex h-screen bg-gray-100 text-black">
//         <Sidebar />
//         <main className="flex-1 flex flex-col text-gray-950 ">
//           <Topbar />
//           <div className="p-4 overflow-y-auto text-gray-950">{children}</div>
//         </main>
//       </body>
//     </html>
//   );
// }




// app/layout.tsx
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export const metadata = {
  title: "Crypto Monitor",
  description: "Live crypto price tracking in USD and NGN",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* ✅ Ensure global background and foreground inherit from CSS variables */}
      <body className="flex h-screen bg-bg text-foreground font-sans">
        <Sidebar />

        {/* ✅ Use variable-based colors instead of hard-coded grays */}
        <main className="flex-1 flex flex-col bg-surface">
          <Topbar />

          {/* ✅ Preserve spacing and scroll behavior but inherit colors */}
          <div className="p-4 overflow-y-auto ">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
