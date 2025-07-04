"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Crown,
  TrendingUp,
  Zap,
  Users,
  Verified,
} from "lucide-react";
import Link from "next/link";

const creators = [
  {
    id: 1,
    handle: "@alice_creates",
    avatar: "/placeholder.svg?height=60&width=60",
    tokensMinted: 15420,
    holders: 892,
    verified: true,
    trending: true,
    rank: 1,
  },
  {
    id: 2,
    handle: "@crypto_artist",
    avatar: "/placeholder.svg?height=60&width=60",
    tokensMinted: 12350,
    holders: 654,
    verified: true,
    trending: false,
    rank: 2,
  },
  {
    id: 3,
    handle: "@web3_builder",
    avatar: "/placeholder.svg?height=60&width=60",
    tokensMinted: 9870,
    holders: 543,
    verified: false,
    trending: true,
    rank: 3,
  },
  {
    id: 4,
    handle: "@defi_queen",
    avatar: "/placeholder.svg?height=60&width=60",
    tokensMinted: 8420,
    holders: 432,
    verified: true,
    trending: false,
    rank: 4,
  },
  {
    id: 5,
    handle: "@nft_wizard",
    avatar: "/placeholder.svg?height=60&width=60",
    tokensMinted: 7650,
    holders: 389,
    verified: false,
    trending: true,
    rank: 5,
  },
];

const tabs = [
  { id: "creators", label: "Top Creators", icon: Crown },
  { id: "trending", label: "Trending Videos", icon: TrendingUp },
  { id: "boosted", label: "Boosted Campaigns", icon: Zap },
];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("creators");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Leaderboard</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-4">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={`flex-1 flex items-center gap-2 rounded-2xl transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-purple-500/30"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {activeTab === "creators" && (
          <>
            {creators.map((creator) => (
              <Card
                key={creator.id}
                className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-sm">
                      {creator.rank}
                    </div>

                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="w-12 h-12 border-2 border-white/20">
                        <AvatarImage
                          src={creator.avatar || "/placeholder.svg"}
                        />
                        <AvatarFallback>
                          {creator.handle[1].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {creator.rank <= 3 && (
                        <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 fill-current" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                          {creator.handle}
                        </span>
                        {creator.verified && (
                          <Verified className="h-4 w-4 text-blue-400 fill-current" />
                        )}
                        {creator.trending && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
                            Trending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          <span>
                            {creator.tokensMinted.toLocaleString()} tokens
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{creator.holders} holders</span>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <Link href="/profile">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                      >
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {activeTab === "trending" && (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white/80 mb-2">
              Trending Videos
            </h3>
            <p className="text-white/60">
              Coming soon! Discover the hottest videos on Farcaster Reels.
            </p>
          </div>
        )}

        {activeTab === "boosted" && (
          <div className="text-center py-12">
            <Zap className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white/80 mb-2">
              Boosted Campaigns
            </h3>
            <p className="text-white/60">
              Explore promoted content and sponsored videos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
