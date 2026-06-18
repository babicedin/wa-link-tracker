import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WA Click Tracker",
  description: "Track WhatsApp link clicks per employee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
