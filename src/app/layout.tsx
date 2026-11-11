import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { Providers } from "@/components/providers";
import { generateSiteMetadata } from "@/lib/useful/utils/metadata";
import { siteConfig } from "@/config/layout";

import "@styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = generateSiteMetadata({
  title: siteConfig.tagline,
  description: siteConfig.description,
  path: "/",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${montserrat.variable} font-sans antialiased min-h-screen bg-background text-foreground selection:bg-primary/20`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
