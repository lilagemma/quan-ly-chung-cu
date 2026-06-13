import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from 'next/script';
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MyCT2 - Quản lý chung cư",
  description: "Hệ thống quản lý chung cư MyCT2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Script
          src="https://www.paypal.com/sdk/js?client-id=AUbQSUHLDdJ2VGQ7YHLfAiqnoRShI3rgQZ9OtUmRy3jHjTaeiWiudC9ePTelDI23zmD2UUVbmJP7fpuf&currency=USD"
          strategy="afterInteractive"
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
