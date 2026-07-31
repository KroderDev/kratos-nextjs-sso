import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { NavigationFeedback } from "@/components/layout/navigation-feedback";
import { FaviconProvider } from "@/components/layout/favicon-provider";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { brandName } from "@/lib/branding";

import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: brandName,
    template: `%s | ${brandName}`,
  },
  description: "A secure, server-rendered access point for private workspaces.",
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={cn("h-full antialiased font-sans", geistMono.variable, inter.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider initialLocale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
            enableSystem
          >
            <FaviconProvider />
            <NavigationFeedback />
            {children}
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

