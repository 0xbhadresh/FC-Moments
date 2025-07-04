import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";
const inter = Inter({ subsets: ["latin"] });

const frame = {
  version: "next",
  imageUrl: `https://gateway.lighthouse.storage/ipfs/bafybeihzmtqcmhrpgksye3y3knpfwtmvua2qs4tixeewrakq6gv3ijzgjy`,
  button: {
    title: "Watch Moments",
    action: {
      type: "launch_frame",
      name: "Farcaster Moments",
      url: APP_URL,
      splashImageUrl: `https://gateway.lighthouse.storage/ipfs/bafkreihhuuxqhhibsdssdcpyflhjto5yzlgbknqkl7vexks4zoualqvnle`,
      splashBackgroundColor: "#000000",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Farcaster Reels - Decentralized Video Platform",
    openGraph: {
      title: "Farcaster Reels - Decentralized Video Platform",
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
