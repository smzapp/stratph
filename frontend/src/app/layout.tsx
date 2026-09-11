import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StratPH — Try. Prove. Hire.",
  description:
    "A Philippine job platform built on paid work trials, reverse hiring, and AI-powered skill-gap analysis.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${ibmPlexMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
