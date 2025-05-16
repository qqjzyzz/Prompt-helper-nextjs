import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import { LoginPopover } from "@/components/LoginPopover"; // Comment out or remove
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "多框架提示词助手",
  description: "AI-powered prompt generation assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <main className="flex-grow container mx-auto py-6">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}