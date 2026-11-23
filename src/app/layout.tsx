
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Critic's Frame",
    template: "%s | Critic's Frame",
  },
  description:
    "Critique your favorite films. Share your thoughts and keep track of your movie reviews with Critic's Frame.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" id="top">
      <body>{children}</body>
    </html>
  );
}
