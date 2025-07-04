"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Settings,
  Share,
  Users,
  Zap,
  Grid3X3,
  List,
  Play,
} from "lucide-react";
import Link from "next/link";
import { sdk } from "@farcaster/frame-sdk";

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface ProfileData {
  handle: string;
  displayName: string;
  bio: string;
  avatar: string;
  followers: number;
  following: number;
  totalTokensMinted: number;
  totalHolders: number;
  verified: boolean;
}

const userVideos = [
  {
    id: 1,
    thumbnail: "/placeholder.svg?height=200&width=150",
    views: 1247,
    duration: "0:15",
  },
  {
    id: 2,
    thumbnail: "/placeholder.svg?height=200&width=150",
    views: 892,
    duration: "0:23",
  },
  {
    id: 3,
    thumbnail: "/placeholder.svg?height=200&width=150",
    views: 2156,
    duration: "0:18",
  },
  {
    id: 4,
    thumbnail: "/placeholder.svg?height=200&width=150",
    views: 654,
    duration: "0:31",
  },
  {
    id: 5,
    thumbnail: "/placeholder.svg?height=200&width=150",
    views: 1834,
    duration: "0:12",
  },
  {
    id: 6,
    thumbnail: "/placeholder.svg?height=200&width=150",
    views: 743,
    duration: "0:27",
  },
];

export default function ProfilePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [profileData, setProfileData] = useState<ProfileData>({
    handle: "@loading...",
    displayName: "Loading...",
    bio: "Loading profile information...",
    avatar: "/placeholder.svg?height=100&width=100",
    followers: 0,
    following: 0,
    totalTokensMinted: 0,
    totalHolders: 0,
    verified: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Initialize the Farcaster SDK
        await sdk.actions.ready({ disableNativeGestures: true });

        // Get the user context from the SDK
        const context = await sdk.context;
        console.log("Farcaster context:", context);

        if (context?.user) {
          const user: FarcasterUser = context.user;

          // Update profile data with real Farcaster information
          setProfileData({
            handle: user.username ? `@${user.username}` : `@fid_${user.fid}`,
            displayName: user.displayName || `User ${user.fid}`,
            bio: "Building the future of decentralized social media 🚀 | Web3 Creator | NFT Artist", // Default bio since it's not in context
            avatar: user.pfpUrl || "/placeholder.svg?height=100&width=100",
            followers: 12500, // Mock data for now - would need API call to get real data
            following: 892, // Mock data for now
            totalTokensMinted: 15420, // Mock data for now
            totalHolders: 892, // Mock data for now
            verified: true, // Mock data for now
          });
        } else {
          console.log("No user context available, using fallback data");
          // Fallback to mock data if no context
          setProfileData({
            handle: "@alice_creates",
            displayName: "Alice Creates",
            bio: "Building the future of decentralized social media 🚀 | Web3 Creator | NFT Artist",
            avatar: "/placeholder.svg?height=100&width=100",
            followers: 12500,
            following: 892,
            totalTokensMinted: 15420,
            totalHolders: 892,
            verified: true,
          });
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
        // Fallback to mock data on error
        setProfileData({
          handle: "@alice_creates",
          displayName: "Alice Creates",
          bio: "Building the future of decentralized social media 🚀 | Web3 Creator | NFT Artist",
          avatar: "/placeholder.svg?height=100&width=100",
          followers: 12500,
          following: 892,
          totalTokensMinted: 15420,
          totalHolders: 892,
          verified: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, []);

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
            <h1 className="text-xl font-bold">{profileData.handle}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <Share className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
            <p className="text-white/60">Loading profile...</p>
          </div>
        </div>
      )}

      {/* Profile Info */}
      {!isLoading && (
        <div className="p-6 space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 border-2 border-white/20">
              <AvatarImage src={profileData.avatar || "/placeholder.svg"} />
              <AvatarFallback>{profileData.displayName[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">
                  {profileData.displayName}
                </h2>
                {profileData.verified && (
                  <Badge className="bg-blue-500 text-white text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-white/60 text-sm mb-3">{profileData.bio}</p>

              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="font-bold text-white">
                    {profileData.followers.toLocaleString()}
                  </div>
                  <div className="text-white/60">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white">
                    {profileData.following.toLocaleString()}
                  </div>
                  <div className="text-white/60">Following</div>
                </div>
              </div>
            </div>
          </div>

          {/* Token Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <Zap className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <div className="text-lg font-bold text-white">
                  {profileData.totalTokensMinted.toLocaleString()}
                </div>
                <div className="text-xs text-white/60">Tokens Minted</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <div className="text-lg font-bold text-white">
                  {profileData.totalHolders.toLocaleString()}
                </div>
                <div className="text-xs text-white/60">Total Holders</div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
              Follow
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              Message
            </Button>
          </div>
        </div>
      )}

      {/* Content Section */}
      {!isLoading && (
        <div className="border-t border-white/10">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between p-4">
            <h3 className="text-lg font-semibold text-white">
              Videos ({userVideos.length})
            </h3>
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className={`w-8 h-8 ${
                  viewMode === "grid"
                    ? "bg-white/10 text-white"
                    : "text-white/60"
                }`}
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`w-8 h-8 ${
                  viewMode === "list"
                    ? "bg-white/10 text-white"
                    : "text-white/60"
                }`}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Videos Grid */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-3 gap-1 p-4 pt-0">
              {userVideos.map((video) => (
                <Link
                  key={video.id}
                  href="/"
                  className="relative aspect-[3/4] group"
                >
                  <div className="w-full h-full bg-white/5 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnail || "/placeholder.svg"}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      {video.duration}
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                      <Play className="h-3 w-3 fill-current" />
                      {video.views}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 pt-0 space-y-3">
              {userVideos.map((video) => (
                <Link key={video.id} href="/" className="block">
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200">
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <div className="w-16 h-20 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={video.thumbnail || "/placeholder.svg"}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                            <Play className="h-3 w-3" />
                            {video.views} views
                          </div>
                          <div className="text-white/60 text-sm">
                            Duration: {video.duration}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
