import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoleBook — AI Financial Discipline for SMEs",
  description:
    "From Cash Chaos to Financial Control. AI-powered financial discipline platform for sole proprietors and SMEs.",
  keywords: ["fintech", "SME", "financial discipline", "cash flow", "Sri Lanka"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <body className="bg-background text-foreground font-sans antialiased">
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#1E293B",
              border: "1px solid #2A3F5F",
              color: "#F8FAFC",
            },
          }}
        />
      </body>
    </html>
  );
}
