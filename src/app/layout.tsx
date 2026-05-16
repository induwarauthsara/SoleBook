import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoleBook — From Cash Chaos to Financial Control",
  description:
    "SoleBook is the AI-powered financial discipline engine for Sri Lankan sole proprietors and small businesses. Allocate cash, reserve obligations, pay yourself properly — all without changing your bank.",
  keywords: [
    "SoleBook",
    "fintech Sri Lanka",
    "SME financial discipline",
    "AI cash allocation",
    "sole proprietor",
    "small business finance",
    "owner salary",
    "cash flow",
  ],
  authors: [{ name: "SoleBook" }],
  openGraph: {
    title: "SoleBook — From Cash Chaos to Financial Control",
    description:
      "AI-powered financial discipline for Sri Lankan SMEs. Built on top of your existing bank.",
    type: "website",
    locale: "en_LK",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#111827]">
        {children}
      </body>
    </html>
  );
}
