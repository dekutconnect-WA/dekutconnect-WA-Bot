import React from 'react';
import Script from 'next/script';
import './globals.css';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import NextNProgress from '../components/NextNProgress';
import Footer from '../components/Footer';
import FeaturedPopup from '../components/FeaturedPopup';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
};

export const metadata = {
  metadataBase: new URL('https://puruboy-api.vercel.app'),
  title: {
    default: 'PuruBoy API - Platform API Modular & Tools AI Gratis',
    template: '%s | PuruBoy API'
  },
  description: 'PuruBoy API menyediakan layanan REST API gratis untuk developer. Fitur mencakup AI Chat, Text to Image, Downloader (TikTok, YouTube, IG), Anime Streaming, dan Tools bermanfaat lainnya. Cepat, stabil, dan mudah diintegrasikan.',
  keywords: ['PuruBoy API', 'REST API Gratis', 'API AI Indonesia', 'TikTok Downloader API', 'YouTube API', 'Anime API', 'Web Tools', 'Developer Resources'],
  authors: [{ name: 'PuruBoy' }],
  creator: 'PuruBoy',
  openGraph: {
    title: 'PuruBoy API - Solusi API Modular & Cepat',
    description: 'Akses ratusan endpoint API gratis untuk AI, Downloader, dan Anime. Dokumentasi lengkap dan respons cepat.',
    url: 'https://puruboy-api.vercel.app',
    siteName: 'PuruBoy API',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PuruBoy API - Platform API & Tools AI',
    description: 'Platform API gratis dengan fitur AI, Downloader, dan Anime.',
    creator: '@puruboy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
  verification: {
    google: 'google41f3f05fef8cd977',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="antialiased pb-24">
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js" 
          strategy="afterInteractive" 
        />
        
        <NextNProgress />
        <FeaturedPopup />
        <Navbar />
        
        <div className="background-animation"></div>
        
        {/* Menggunakan min-h-dvh untuk stabilitas viewport pada mobile */}
        <div className="container mx-auto px-4 max-w-md md:max-w-3xl min-h-dvh relative z-10 pt-6 md:pt-24">
            <main className="relative z-20">{children}</main>
            <Footer />
        </div>
        <BottomNav />
      </body>
    </html>
  );
}