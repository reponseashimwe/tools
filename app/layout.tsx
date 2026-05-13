import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevTools — Browser-Native Dev Utilities",
  description: "Fast, private, no-upload utilities that run entirely in your browser.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      {/* Anti-flash: sets theme class before first paint */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased transition-colors duration-200">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-200 dark:border-gray-800 py-5 text-center text-xs text-gray-400 dark:text-gray-600">
            <span className="font-medium text-gray-500 dark:text-gray-500">DevTools</span>
            {" — "}browser-native utilities, built with Next.js
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
