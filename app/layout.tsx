import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import { ToastProvider } from "./components/Toast";
import { Analytics } from "@vercel/analytics/react";
import ChatFlottant from "./components/ChatFlottant";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Novalys',
      description: 'Coach IA pour la physique-chimie au lycée, de la Seconde à la Terminale.',
      url: 'https://coach-pc.vercel.app',
      areaServed: 'FR',
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: 'student',
      },
    }),
  }}
/>
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
export const metadata: Metadata = {
  metadataBase: new URL('https://coach-pc.vercel.app'),
  title: {
    default: 'Novalys — Ton coach IA pour la physique-chimie',
    template: '%s | Novalys',
  },
  description: 'Novalys transforme chaque cours de physique-chimie en un plan de travail clair : fiches, exercices et suivi générés par IA, de la Seconde à la Terminale. Prépare le bac sereinement.',
  keywords: ['physique-chimie', 'bac', 'terminale', 'révisions', 'coach IA', 'exercices physique chimie', 'lycée', 'fiches de révision'],
  authors: [{ name: 'Novalys' }],
  openGraph: {
    title: 'Novalys — Ton coach IA pour la physique-chimie',
    description: 'Fiches, exercices et suivi personnalisé générés par IA, de la Seconde à la Terminale. Arrête de te demander quoi réviser.',
    url: 'https://coach-pc.vercel.app',
    siteName: 'Novalys',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Novalys — Ton coach IA pour la physique-chimie',
    description: 'Fiches, exercices et suivi personnalisé générés par IA, de la Seconde à la Terminale.',
  },
  robots: {
    index: true,
    follow: true,
  },
}