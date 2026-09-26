import type { Metadata } from "next";
import { Belleza, Noto_Sans, Noto_Sans_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { env } from "@/lib/env";

import "./globals.css";

const sans = Noto_Sans({ variable: "--font-noto-sans", subsets: ["latin"] });
const heading = Belleza({ variable: "--font-belleza", subsets: ["latin"], weight: "400" });
const mono = Noto_Sans_Mono({ variable: "--font-noto-sans-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { template: `%s | ${env.brandName} admin`, default: `${env.brandName} admin` },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${heading.variable} ${mono.variable} antialiased`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
