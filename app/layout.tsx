import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dodge Mint",
  description: "Mobile-first arcade dodge game",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
