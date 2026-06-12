import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Geist_Mono, Manrope } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { AppToaster } from "@/components/ui/app-toaster";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const themeInitScript = `(function(){try{var theme=localStorage.getItem("theme");var isDark=theme?theme==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",isDark);document.documentElement.dataset.theme=isDark?"dark":"light";}catch(e){}})();`;

export const metadata: Metadata = {
  title: "JobTracker",
  description: "Theo dõi việc làm, quản lý ứng tuyển và điều hành dashboard quản trị.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${manrope.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Suspense>
            <AppToaster />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
