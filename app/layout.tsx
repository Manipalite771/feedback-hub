import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "MWP Comments",
  description: "Comments and suggestions for the upgraded MWP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.className} antialiased bg-white text-gray-900`}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
