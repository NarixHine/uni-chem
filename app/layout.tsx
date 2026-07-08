import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChemDoodle Next.js App",
  description: "Rendering chemical structures with ChemDoodle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* CWC stylesheet — loaded upfront */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link
          rel="stylesheet"
          href="/ChemDoodleWeb-11.0.0/ChemDoodleWeb.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}

        {/* CWC core + bridge. CWC declares `let ChemDoodle` in strict
            mode, which does not create a window property. The bridge
            copies the lexical binding to window for client access. */}
        <Script
          src="/ChemDoodleWeb-11.0.0/ChemDoodleWeb.js"
          strategy="beforeInteractive"
        />
        <Script
          src="/ChemDoodleWeb-11.0.0/chemdoodle-bridge.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
