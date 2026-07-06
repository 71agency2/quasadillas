import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Food Plus",
  description: "Depuis 2011",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}