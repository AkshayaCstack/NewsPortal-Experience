import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "NewsPortal - Your Trusted News Source",
    template: "%s | NewsPortal",
  },
  description: "Breaking news, in-depth analysis, and comprehensive coverage of the stories that matter most.",
  keywords: ["news", "breaking news", "world news", "politics", "technology", "sports"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
