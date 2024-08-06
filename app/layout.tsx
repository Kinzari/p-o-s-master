import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "POS System",
  description: "Point of Sale System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/public/pos/minilogo.ico" type="image/x-icon" />
        <meta name="description" content="Point of Sale System" />
        <title>POS System</title>
      </head>
      <body className="bg-zinc-900">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
