import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import { ToastProvider } from "./components/Toast";
import { Analytics } from "@vercel/analytics/react";
import ChatFlottant from "./components/ChatFlottant";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Novalys — Ton coach IA pour le bac',
  description: 'Révise la physique-chimie intelligemment avec un coach IA personnalisé.',
  icons: {
    icon: '/icon.svg',
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <Nav />
          {children}
        </ToastProvider>
        <Analytics />
        <ChatFlottant />
      </body>
    </html>
  );
}