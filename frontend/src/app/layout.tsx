import type { Metadata } from "next";
import { Newsreader, Manrope } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Schedulfy — Personal Routine OS",
  description: "Intelligent personal routine and diet execution system",
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: "#fff8f2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#fff8f2] text-[#1f1b14] font-sans flex flex-col selection:bg-[#a43716]/20">
        {children}
      </body>
    </html>
  );
}
