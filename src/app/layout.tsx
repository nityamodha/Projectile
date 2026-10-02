import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Projectile",
  description: "A focused project planning workspace with WBS scheduling and Gantt charts."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
