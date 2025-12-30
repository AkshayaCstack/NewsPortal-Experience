import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "NewzHub - Your Trusted News Source",
    template: "%s | NewzHub",
  },
  description: "Breaking news, in-depth analysis, and comprehensive coverage of the stories that matter most.",
};

// Root layout - just provides html structure
// Actual layout with Header/Footer is in [locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
