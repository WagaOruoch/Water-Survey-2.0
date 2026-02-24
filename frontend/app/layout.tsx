import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Water Site Survey",
  description: "Water site field survey form",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
