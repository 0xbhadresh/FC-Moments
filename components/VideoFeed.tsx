"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { sdk } from "@farcaster/frame-sdk";
import {
  Heart,
  Share,
  Zap,
  User,
  TrendingUp,
  Users,
  Gift,
  Plus,
  MessageCircle,
  Menu,
  MoreVertical,
  ThumbsUp,
  X,
  Volume2,
  VolumeX,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import {
  tradeCoin,
  TradeParameters,
  createTradeCall,
} from "@zoralabs/coins-sdk";
import { parseEther } from "viem";
import { base } from "viem/chains";
import type { Account } from "viem";

// Comment type for API
type Comment = {
  _id?: string;
  videoId: string;
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
  content: string;
  createdAt?: string;
};

// Type for video object from API
type Video = {
  _id?: string;
  title: string;
  description: string;
  videoCid: string;
  metadataCid: string;
  tokenData: {
    name: string;
    symbol: string;
    supply: number;
    price: string;
    chain: string;
    royalties: boolean;
  };
  creatorInfo: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
    walletAddress: string;
  };
  transactionHash: string;
  coinAddress: string;
  createdAt: { $date: string } | string;
  updatedAt: { $date: string } | string;
  views: number;
  likes: number;
  shares: number;
};

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function VideoFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [liked, setLiked] = useState<boolean[]>([]);
  const [likeCounts, setLikeCounts] = useState<number[]>([]);
  const [minting, setMinting] = useState<boolean[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [selectedVideoComments, setSelectedVideoComments] = useState<
    number | null
  >(null);
  const [comments, setComments] = useState<Comment[][]>([]); // Array of comments per video
  const [newComment, setNewComment] = useState<string>("");
  const [commentsLoading, setCommentsLoading] = useState<boolean[]>([]);
  const [likesLoading, setLikesLoading] = useState<boolean[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [mutedStates, setMutedStates] = useState<boolean[]>([]);
  const [farcasterUser, setFarcasterUser] = useState<{
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeAmount, setTradeAmount] = useState<string>("");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);
  const [estimatedOut, setEstimatedOut] = useState<string>("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Pills for quick ETH amounts
  const tradePills = ["0.0001", "0.001", "0.01"];

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: base.id });
  const publicClient = usePublicClient({ chainId: base.id });

  useEffect(() => {
    sdk.actions.ready({ disableNativeGestures: true });
    console.log("[SDK] Farcaster MiniApp SDK is ready");
  }, []);

  // Fetch videos from API on mount
  useEffect(() => {
    setLoading(true);
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.videos) {
          setVideos(shuffleArray(data.videos));
          setLiked(new Array(data.videos.length).fill(false));
          setMinting(new Array(data.videos.length).fill(false));
          setComments(new Array(data.videos.length).fill([]));
          setCommentsLoading(new Array(data.videos.length).fill(false));
          setLikesLoading(new Array(data.videos.length).fill(false));
          setLikeCounts(new Array(data.videos.length).fill(0));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const loadFarcasterUser = async () => {
      try {
        const context = await sdk.context;
        console.log("Farcaster context in upload:", context);

        if (context?.user) {
          setFarcasterUser(context.user);
        }
      } catch {
        // Silently handle Farcaster context errors
      }
    };

    loadFarcasterUser();
  }, []);

  // Fetch likes and comments for the current video
  useEffect(() => {
    if (!videos.length) return;
    const fetchLikes = async () => {
      setLikesLoading((prev) => {
        const arr = [...prev];
        arr[currentVideo] = true;
        return arr;
      });
      const id = videos[currentVideo]._id;
      if (!id) return;
      const res = await fetch(`/api/videos/${id}/likes`);
      const data = await res.json();
      setLikeCounts((prev) => {
        const arr = [...prev];
        arr[currentVideo] = data.count || 0;
        return arr;
      });
      if (farcasterUser) {
        // Check if user liked
        const userLike = data.likes?.find(
          (l: { fid: number; liked: boolean }) => l.fid === farcasterUser.fid
        );
        setLiked((prev) => {
          const arr = [...prev];
          arr[currentVideo] = !!(userLike && userLike.liked);
          return arr;
        });
      }
      setLikesLoading((prev) => {
        const arr = [...prev];
        arr[currentVideo] = false;
        return arr;
      });
    };
    const fetchComments = async () => {
      setCommentsLoading((prev) => {
        const arr = [...prev];
        arr[currentVideo] = true;
        return arr;
      });
      const id = videos[currentVideo]._id;
      if (!id) return;
      const res = await fetch(`/api/videos/${id}/comments`);
      const data = await res.json();
      setComments((prev: Comment[][]) => {
        const arr = [...prev];
        arr[currentVideo] = data.comments || [];
        return arr;
      });
      setCommentsLoading((prev) => {
        const arr = [...prev];
        arr[currentVideo] = false;
        return arr;
      });
    };
    fetchLikes();
    fetchComments();
  }, [currentVideo, videos, farcasterUser]);

  // Like/unlike handler
  const handleLike = useCallback(
    async (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!farcasterUser || !videos[index]?._id) return;
      setLikesLoading((prev) => {
        const arr = [...prev];
        arr[index] = true;
        return arr;
      });
      const likedNow = !liked[index];
      setLiked((prev) => {
        const arr = [...prev];
        arr[index] = likedNow;
        return arr;
      });
      // Optimistically update like count
      setLikeCounts((prev) => {
        const arr = [...prev];
        arr[index] = prev[index] + (likedNow ? 1 : -1);
        return arr;
      });
      await fetch(`/api/videos/${videos[index]._id}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: farcasterUser.fid,
          username: farcasterUser.username,
          displayName: farcasterUser.displayName,
          pfpUrl: farcasterUser.pfpUrl,
          liked: likedNow,
        }),
      });
      setLikesLoading((prev) => {
        const arr = [...prev];
        arr[index] = false;
        return arr;
      });
    },
    [farcasterUser, liked, videos]
  );

  // Comment submit handler
  const handleCommentSubmit = async () => {
    if (!farcasterUser || !videos[currentVideo]?._id || !newComment.trim())
      return;
    setCommentsLoading((prev) => {
      const arr = [...prev];
      arr[currentVideo] = true;
      return arr;
    });
    await fetch(`/api/videos/${videos[currentVideo]._id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fid: farcasterUser.fid,
        username: farcasterUser.username,
        displayName: farcasterUser.displayName,
        pfpUrl: farcasterUser.pfpUrl,
        content: newComment,
      }),
    });
    // Refetch comments
    const res = await fetch(`/api/videos/${videos[currentVideo]._id}/comments`);
    const data = await res.json();
    setComments((prev: Comment[][]) => {
      const arr = [...prev];
      arr[currentVideo] = data.comments || [];
      return arr;
    });
    setCommentsLoading((prev) => {
      const arr = [...prev];
      arr[currentVideo] = false;
      return arr;
    });
    setNewComment("");
  };

  const handleScroll = useCallback(
    (e: React.WheelEvent) => {
      // WheelEvent does not have changedTouches; remove that check
      if (e.deltaY > 0 && currentVideo < videos.length - 1) {
        setCurrentVideo((prev) => prev + 1);
      } else if (e.deltaY < 0 && currentVideo > 0) {
        setCurrentVideo((prev) => prev - 1);
      }
    },
    [currentVideo]
  );

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
    setTouchEnd(null);
  };

  const onTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    if (distance > 50 && currentVideo < videos.length - 1) {
      setCurrentVideo((prev) => prev + 1);
    } else if (distance < -50 && currentVideo > 0) {
      setCurrentVideo((prev) => prev - 1);
    }
  };

  const handleShowComments = useCallback(
    (videoId: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedVideoComments(videoId);
      setShowComments(true);
    },
    []
  );

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowComments(false);
      setSelectedVideoComments(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" && currentVideo < videos.length - 1) {
        setCurrentVideo((prev) => prev + 1);
      } else if (e.key === "ArrowUp" && currentVideo > 0) {
        setCurrentVideo((prev) => prev - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentVideo]);

  useEffect(() => {
    const current = videoRefs.current[currentVideo];
    if (current) {
      current.muted = false;
      current.play().catch(() => {});
    }
    // Mute all other videos
    videoRefs.current.forEach((video, i) => {
      if (video && i !== currentVideo) {
        video.muted = true;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideo]);

  // Remove onTouchMove from JSX and attach natively
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStart !== null) {
        setTouchEnd(e.touches[0].clientY);
        e.preventDefault();
      }
    };

    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    return () => {
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [touchStart]);

  // Update mutedStates when videos or currentVideo changes
  useEffect(() => {
    setMutedStates(videos.map((_, i) => i !== currentVideo));
  }, [videos, currentVideo]);

  // Trade handler
  const handleTrade = async () => {
    setTradeLoading(true);
    setTradeError(null);
    setTradeSuccess(null);
    try {
      if (!isConnected || !address || !walletClient || !publicClient) {
        throw new Error("Please connect your wallet on Base network");
      }
      const coinAddress = videos[currentVideo]?.coinAddress;
      if (!coinAddress) throw new Error("Coin address not found");
      if (
        !tradeAmount ||
        isNaN(Number(tradeAmount)) ||
        Number(tradeAmount) <= 0
      ) {
        throw new Error("Enter a valid ETH amount");
      }
      if (!isHexString(address)) {
        throw new Error("Invalid wallet address");
      }
      const tradeParameters: TradeParameters = {
        sell: { type: "eth" },
        buy: { type: "erc20", address: coinAddress as `0x${string}` },
        amountIn: parseEther(tradeAmount),
        slippage: 0.05,
        sender: address,
      };
      const receipt = await tradeCoin({
        tradeParameters,
        walletClient,
        account: address as unknown as Account,
        publicClient,
      });
      setTradeSuccess("Trade successful! Tx: " + receipt.transactionHash);
    } catch (err: unknown) {
      // @ts-expect-error: err.message is safe here for wagmi/viem errors
      if (err?.message?.toLowerCase().includes("user rejected")) {
        setTradeError("You cancelled the transaction in your wallet.");
      } else if (err && typeof err === "object" && "message" in err) {
        setTradeError((err as { message?: string }).message || "Trade failed");
      } else {
        setTradeError("Trade failed");
      }
    } finally {
      setTradeLoading(false);
    }
  };

  useEffect(() => {
    const fetchQuote = async () => {
      setEstimatedOut("");
      setQuoteError(null);
      if (
        !tradeAmount ||
        isNaN(Number(tradeAmount)) ||
        Number(tradeAmount) <= 0
      )
        return;
      if (!isConnected || !address || !walletClient || !publicClient) return;
      const coinAddress = videos[currentVideo]?.coinAddress;
      if (!coinAddress) return;
      setQuoteLoading(true);
      try {
        const tradeParameters: TradeParameters = {
          sell: { type: "eth" },
          buy: { type: "erc20", address: coinAddress as `0x${string}` },
          amountIn: parseEther(tradeAmount),
          slippage: 0.05,
          sender: address,
        };
        const quote = await createTradeCall(tradeParameters);
        // quote.buyAmount is a string or BigInt (in token decimals)
        // For display, show as a float with 4 decimals
        const decimals = 18; // Most ERC20s, adjust if needed
        let outNum = 0;
        if (typeof quote.quote.amountOut === "bigint") {
          outNum = Number(quote.quote.amountOut) / 10 ** decimals;
        } else if (typeof quote.quote.amountOut === "string") {
          outNum = Number(quote.quote.amountOut) / 10 ** decimals;
        }
        setEstimatedOut(outNum.toFixed(4));
      } catch {
        setQuoteError("Could not fetch quote");
      } finally {
        setQuoteLoading(false);
      }
    };
    fetchQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tradeAmount,
    currentVideo,
    isConnected,
    address,
    walletClient,
    publicClient,
  ]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        Loading videos...
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        No videos found.
      </div>
    );
  }

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      {/* Mobile Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-b from-black/70 to-transparent">
          <h1 className="text-white font-bold text-lg sm:text-xl">
            Farcaster Reels
          </h1>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex gap-2">
            <Link href="/leaderboard">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 touch-target"
              >
                <TrendingUp className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/invite">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 touch-target"
              >
                <Gift className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/profile">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 touch-target"
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden text-white hover:bg-white/20 touch-target"
            onClick={() => setShowMenu(!showMenu)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMenu && (
          <div className="sm:hidden absolute top-full left-0 right-0 bg-black/90 backdrop-blur-lg border-b border-white/10 animate-slideUp">
            <div className="flex flex-col p-3 space-y-2">
              <Link href="/leaderboard" onClick={() => setShowMenu(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10 touch-target"
                >
                  <TrendingUp className="h-5 w-5 mr-3" />
                  Leaderboard
                </Button>
              </Link>
              <Link href="/invite" onClick={() => setShowMenu(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10 touch-target"
                >
                  <Gift className="h-5 w-5 mr-3" />
                  Invite Friends
                </Button>
              </Link>
              <Link href="/profile" onClick={() => setShowMenu(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10 touch-target"
                >
                  <User className="h-5 w-5 mr-3" />
                  Profile
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative h-full transition-transform duration-300 ease-out"
        style={{
          transform: `translateY(-${currentVideo * 100}vh)`,
          touchAction: "pan-x", // disables vertical scroll/pull-to-refresh
        }}
        onWheel={handleScroll}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {videos.map((video, index) => {
          // Pinata gateway for video source
          const videoUrl = video.videoCid
            ? `https://aquamarine-obliged-xerinae-953.mypinata.cloud/ipfs/${video.videoCid}`
            : "";
          const creator = video.creatorInfo?.username
            ? `@${video.creatorInfo.username}`
            : "@unknown";
          const avatar =
            video.creatorInfo?.pfpUrl || "/placeholder.svg?height=40&width=40";
          const caption = video.description || video.title || "";
          const likes = likeCounts[index] || 0;
          const holders = video.tokenData?.supply || 0;
          const tokensMinted = video.tokenData?.supply || 0;
          const mintPrice = video.tokenData?.price || "0.00";
          const boosted = false; // You can set logic for boosted if needed
          const commentsCount = comments[index]?.length || 0;
          return (
            <div
              key={video._id || video.videoCid || index}
              className="h-screen w-full relative flex-shrink-0"
            >
              {/* Video Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                  }}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted={mutedStates[index]}
                  playsInline
                >
                  <source src={videoUrl} type="video/mp4" />
                </video>
              </div>

              {/* Right Side Controls - Mobile Optimized */}
              <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 sm:gap-6 z-40">
                {/* Creator Avatar */}
                <Link
                  href="/profile"
                  className="flex flex-col items-center gap-1"
                >
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white shadow-lg hover:scale-110 transition-transform touch-target">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>
                      {creator[1] ? creator[1].toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                {/* Like Button */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 touch-target ${
                      liked[index]
                        ? "bg-red-500/80 text-white hover:bg-red-500"
                        : "bg-black/40 text-white hover:bg-black/60"
                    }`}
                    onClick={(e) => handleLike(index, e)}
                    disabled={!farcasterUser || likesLoading[index]}
                  >
                    <Heart
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${
                        liked[index] ? "fill-current" : ""
                      }`}
                    />
                  </Button>
                  <span className="text-white text-xs font-medium">
                    {likes.toLocaleString()}
                  </span>
                </div>

                {/* Comments Button */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm hover:bg-black/60 hover:scale-110 transition-all duration-200 touch-target"
                    onClick={(e) => handleShowComments(index, e)}
                    disabled={!farcasterUser || commentsLoading[index]}
                  >
                    <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                  <span className="text-white text-xs font-medium">
                    {commentsCount}
                  </span>
                </div>

                {/* Mint Token Button */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:scale-110 transition-all duration-200 disabled:opacity-50 touch-target"
                    onClick={() => setShowTradeModal(true)}
                    disabled={minting[index]}
                  >
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
                  </Button>
                  <span className="text-white text-xs font-medium">
                    {mintPrice} ETH
                  </span>
                </div>

                {/* Share Button */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm hover:bg-black/60 hover:scale-110 transition-all duration-200 touch-target"
                    onClick={async () => {
                      const video = videos[index];
                      const videoId = video._id;
                      const videoUrl = videoId
                        ? `${window.location.origin}/video/${videoId}`
                        : window.location.origin;
                      const text = `Check out this video on Farcaster Reels!`;
                      try {
                        await sdk.actions.composeCast({
                          text,
                          embeds: [videoUrl],
                        });
                      } catch {
                        // User cancelled or error
                      }
                    }}
                  >
                    <Share className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                  <span className="text-white text-xs font-medium">Share</span>
                </div>

                {/* Mute/Unmute Button */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm hover:bg-black/60 hover:scale-110 transition-all duration-200 touch-target"
                    onClick={() =>
                      setMutedStates((prev) => {
                        const newStates = [...prev];
                        newStates[index] = !newStates[index];
                        return newStates;
                      })
                    }
                    aria-label={
                      mutedStates[index] ? "Unmute video" : "Mute video"
                    }
                  >
                    {mutedStates[index] ? (
                      <VolumeX className="w-6 h-6 text-white" />
                    ) : (
                      <Volume2 className="w-6 h-6 text-white" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Bottom Overlay - Mobile Optimized */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent safe-area-bottom">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-semibold text-sm sm:text-base">
                    {creator}
                  </span>
                  {boosted && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs">
                      Boosted
                    </Badge>
                  )}
                </div>
                <p className="text-white text-sm leading-relaxed mb-3 line-clamp-2 sm:line-clamp-none">
                  {caption}
                </p>
                <div className="flex items-center gap-3 sm:gap-4 text-white/80 text-xs">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{holders} holders</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span className="hidden sm:inline">
                      {tokensMinted.toLocaleString()} tokens minted
                    </span>
                    <span className="sm:hidden">
                      {(tokensMinted / 1000).toFixed(1)}K minted
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scroll Hint - Mobile Optimized */}
      {currentVideo === 0 && (
        <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-sm animate-bounce">
          <span className="hidden sm:inline">Swipe up for more</span>
          <span className="sm:hidden">Swipe up</span>
        </div>
      )}

      {/* Floating Upload Button - Mobile Optimized */}
      <Link
        href="/upload"
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50"
      >
        <Button
          size="icon"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 touch-target"
        >
          <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </Link>

      {/* Comments Modal - Bottom Popup */}
      {showComments && selectedVideoComments !== null && (
        <>
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
          >
            <div
              className="w-full max-w-2xl bg-gray-900/95 backdrop-blur-lg border-t border-white/20 rounded-t-3xl shadow-2xl animate-slideUp max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-1 bg-white/30 rounded-full mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {comments[currentVideo]?.length || 0} Comments
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/60 hover:text-white hover:bg-white/10 touch-target"
                  onClick={() => {
                    setShowComments(false);
                    setSelectedVideoComments(null);
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments[currentVideo]?.map((comment: Comment) => (
                  <div key={comment._id} className="animate-fadeIn">
                    {/* Main Comment */}
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                        <AvatarImage
                          src={comment.pfpUrl || "/placeholder.svg"}
                        />
                        <AvatarFallback className="text-sm">
                          {comment.username?.[1]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        {/* Comment Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-white text-sm">
                              @{comment.username}
                            </span>
                            <span className="text-white/60 text-xs">
                              {comment.displayName}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/40 hover:text-white/60 p-1 touch-target"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </div>
                        {/* Comment Content */}
                        <p className="text-white/90 text-sm leading-relaxed mb-3 break-words">
                          {comment.content}
                        </p>
                        {/* Comment Actions */}
                        <div className="flex items-center gap-4 mb-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/40 hover:text-white/60 p-1 touch-target"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Comment Input - Sticky Bottom */}
              <div className="border-t border-white/10 p-4 bg-gray-900/95 backdrop-blur-lg flex-shrink-0">
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage
                      src={
                        farcasterUser?.pfpUrl ||
                        "/placeholder.svg?height=32&width=32"
                      }
                    />
                    <AvatarFallback className="text-sm">U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full px-4 h-10 touch-target flex-1"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleCommentSubmit()
                      }
                      disabled={!farcasterUser || commentsLoading[currentVideo]}
                    />
                    <Button
                      onClick={handleCommentSubmit}
                      disabled={
                        !farcasterUser ||
                        !newComment.trim() ||
                        commentsLoading[currentVideo]
                      }
                      size="icon"
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white disabled:opacity-50 touch-target flex-shrink-0 rounded-full w-10 h-10"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Trade Modal - Bottom Popup */}
      {showTradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTradeModal(false);
          }}
        >
          <div
            className="w-full max-w-md bg-gray-900/95 backdrop-blur-lg border-t border-white/20 rounded-t-3xl shadow-2xl animate-slideUp max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Trade Coin
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white hover:bg-white/10 touch-target"
                onClick={() => setShowTradeModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 p-4 flex flex-col gap-4">
              <div className="flex gap-2 mb-2">
                {tradePills.map((pill) => (
                  <button
                    key={pill}
                    className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                      tradeAmount === pill
                        ? "bg-purple-500 text-white"
                        : "bg-white/10 text-white/80"
                    }`}
                    onClick={() => setTradeAmount(pill)}
                    disabled={tradeLoading}
                  >
                    {pill} ETH
                  </button>
                ))}
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Custom"
                  value={tradePills.includes(tradeAmount) ? "" : tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="ml-2 px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 w-24 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={tradeLoading}
                />
              </div>
              <Button
                onClick={handleTrade}
                disabled={
                  tradeLoading ||
                  !tradeAmount ||
                  isNaN(Number(tradeAmount)) ||
                  Number(tradeAmount) <= 0 ||
                  !isConnected ||
                  !walletClient ||
                  !publicClient
                }
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white disabled:opacity-50 touch-target"
              >
                {tradeLoading
                  ? "Trading..."
                  : `Trade ${tradeAmount || ""} ETH for Coin`}
              </Button>
              {!isConnected && (
                <div className="text-center text-red-400 text-sm mt-2">
                  Please connect your wallet to trade.
                </div>
              )}
              {tradeError && (
                <div className="text-red-400 text-sm text-center">
                  {tradeError}
                </div>
              )}
              {tradeSuccess && (
                <div className="text-green-400 text-sm text-center">
                  {tradeSuccess}
                </div>
              )}
              {quoteLoading ? (
                <div className="text-white/60 text-sm">Fetching quote...</div>
              ) : quoteError ? (
                <div className="text-red-400 text-sm">{quoteError}</div>
              ) : (
                estimatedOut && (
                  <div className="text-green-400 text-sm">
                    You will receive approximately <b>{estimatedOut}</b> coins
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isHexString(str: string): str is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(str);
}
