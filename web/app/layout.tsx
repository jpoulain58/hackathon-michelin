import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Michelin Trust Wheels — La preuve par la route",
  description:
    "La communaute qui transforme les riders Michelin en prescripteurs, et leurs kilometres en preuve sociale. Trouve ton pneu, compare, roule.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* Filet sans JS : les sections revealees restent visibles. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
