import { Geist } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata = {
  title: "HotelBook — Find & Book Hotels",
  description: "Find the best hotels at the best prices.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geist.variable}>
      <body
        className="min-h-screen bg-gray-50 text-gray-900 antialiased flex flex-col"
        suppressHydrationWarning
      >
        <NextTopLoader
          color="#1a56db"
          height={4}
          showSpinner={false}
          speed={200}
          crawlSpeed={200}
          shadow="0 0 15px #1a56db, 0 0 8px #1a56db"
        />
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "var(--font-geist, sans-serif)",
              },
              success: {
                style: {
                  background: "#f0fdf4",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                },
                iconTheme: { primary: "#22c55e", secondary: "#f0fdf4" },
              },
              error: {
                style: {
                  background: "#fef2f2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                },
                iconTheme: { primary: "#ef4444", secondary: "#fef2f2" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}