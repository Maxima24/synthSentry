import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const satoshi = localFont({
  variable: "--font-satoshi",
  display: "swap",
  src: [
    {
      path: "./_fonts/Satoshi-Variable.woff2",
      weight: "300 900",
      style: "normal",
    },
    {
      path: "./_fonts/Satoshi-VariableItalic.woff2",
      weight: "300 900",
      style: "italic",
    },
  ],
});

export const metadata: Metadata = {
  title: "Synth Sentry",
  description:
    "AI-powered portfolio risk intelligence. Live market data + Gemini reasoning for retail investors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${satoshi.variable} h-full antialiased`}
    >
      <body className="bg-matte min-h-screen p-3 font-sans sm:p-4">
        <div className="flex min-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-frame sm:min-h-[calc(100svh-2rem)]">
          {children}
        </div>
      </body>
    </html>
  );
}
