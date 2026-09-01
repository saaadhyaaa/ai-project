import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AuraWell | AI-Powered Emotional Well-Being Assistant",
  description:
    "Monitor your emotional well-being through daily check-ins, mindful journaling, AI-assisted emotional analysis, and personalized supportive insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
