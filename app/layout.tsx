import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Wrench } from "lucide-react";
import React, { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hamic | AI-Powered Product Support & Diagnostic Assistant",
  description: "A professional platform for finding manufacturer documentation and diagnosing equipment issues with a smart mechanic-like assistant.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        <Suspense fallback={<div className="h-16 border-b border-zinc-800/80 bg-zinc-950/80"></div>}>
          <Navbar initialUser={null} />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
        
        {/* Footer */}
        <footer className="border-t border-zinc-900 bg-zinc-950 py-10 text-center text-sm text-zinc-600">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-2 font-semibold text-zinc-400">
                <Wrench className="h-4 w-4 text-cyan-500" />
                <span>HAMIC Support Portal</span>
              </div>
              <p>© 2026 Hamic Inc. All rights reserved.</p>
              <div className="flex gap-4 text-zinc-500">
                <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
                <a href="#" className="hover:text-zinc-400 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-zinc-400 transition-colors">Contact Support</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
