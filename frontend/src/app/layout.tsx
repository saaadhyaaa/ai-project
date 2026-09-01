import type { Metadata } from "next";
import { Playfair_Display, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "MindEase | AI Wellness & Emotional Companion",
  description:
    "Monitor your emotional well-being through daily check-ins, mindful journaling, AI-assisted reflections, and supportive trend insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${nunito.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#fff7f9] text-[#271624] font-sans selection:bg-[#d98fa3] selection:text-[#5e283a]">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
