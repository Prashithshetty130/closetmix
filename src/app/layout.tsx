import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Closetmix — AI Wardrobe & Intelligent Outfit Stylist",
  description:
    "Digitize your clothing, eliminate decision fatigue, and let multimodal AI style personalized outfits matched to your weather, occasion, and aesthetics.",
  keywords: ["AI Stylist", "Digital Wardrobe", "Capsule Wardrobe", "Outfit Generator", "Fashion AI"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Navbar />
        <main style={{ minHeight: "calc(100vh - 75px)", paddingBottom: "60px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
