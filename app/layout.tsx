import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#FF5500",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "CRACK THE LOCK | ASTHRA 11.0 — Inter-Collegiate Technical Competition",
  description:
    "Different Challenges. One Final Lock. An intensive 4-round progressive technical competition featuring physical challenges, logic puzzles, algorithmic mastery, and the final vault.",
  keywords: [
    "CRACK THE LOCK",
    "ASTHRA 11.0",
    "Technical Competition",
    "Hackathon",
    "Coding",
    "DSA",
    "Inter-Collegiate",
  ],
  authors: [{ name: "ASTHRA 11.0 Technical Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "dark",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-mono",
        jetbrainsMono.variable
      )}
    >
      <body className="min-h-full flex flex-col bg-[#080808] text-[#f4f4f5] selection:bg-[#ff5500] selection:text-white">
        {children}
      </body>
    </html>
  );
}
