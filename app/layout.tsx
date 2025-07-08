import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";
const inter = Inter({ subsets: ["latin"] });

const frame = {
  version: "next",
  imageUrl: APP_URL + "/icon.png",
  button: {
    title: "Watch Moments",
    action: {
      type: "launch_frame",
      name: "Moments",
      url: APP_URL,
      splashImageUrl: APP_URL + "/icon.png",
      splashBackgroundColor: "#FFFFFF",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Moments - Decentralized Video Platform",
    openGraph: {
      title: "Moments - Decentralized Video Platform",
      description:
        "Create, mint, and share short-form videos on the decentralized web",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
