import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ShowWork | Practise a task. Show what you can do.",
  description:
    "Practise real workplace situations. Keep the work, improve it, and choose what to share.",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
