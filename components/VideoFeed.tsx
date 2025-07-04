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
  Send,
  MoreVertical,
  Flag,
  ThumbsUp,
  Reply,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

const videos = [
  {
    id: 1,
    creator: "@alice_creates",
    caption: "Building the future of decentralized social media 🚀",
    likes: 1247,
    holders: 102,
    tokensMinted: 2300,
    mintPrice: "0.005",
    boosted: true,
    avatar: "/placeholder.svg?height=40&width=40",
    comments: 23,
    videoUrl:
      "https://www.riotgames.com/darkroom/original/eedccd01fe642a9a6f5b5a4725c3c1c7:cab5f0653154a0cf9a07d7dc3334a71e/rg-brand-cinematic.mp4",
  },
  {
    id: 2,
    creator: "@crypto_artist",
    caption: "New NFT drop coming soon! What do you think? 🎨",
    likes: 892,
    holders: 67,
    tokensMinted: 1850,
    mintPrice: "0.003",
    boosted: false,
    avatar: "/placeholder.svg?height=40&width=40",
    comments: 15,
    videoUrl:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
  {
    id: 3,
    creator: "@web3_builder",
    caption: "Just shipped a new DeFi protocol. AMA! 💻",
    likes: 2156,
    holders: 234,
    tokensMinted: 4200,
    mintPrice: "0.008",
    boosted: true,
    avatar: "/placeholder.svg?height=40&width=40",
    comments: 42,
    videoUrl:
      "https://www.riotgames.com/darkroom/original/eedccd01fe642a9a6f5b5a4725c3c1c7:cab5f0653154a0cf9a07d7dc3334a71e/rg-brand-cinematic.mp4",
  },
  {
    id: 4,
    creator: "@crypto_artist",
    caption: "New NFT drop coming soon! What do you think? 🎨",
    likes: 892,
    holders: 67,
    tokensMinted: 1850,
    mintPrice: "0.003",
    boosted: false,
    avatar: "/placeholder.svg?height=40&width=40",
    comments: 15,
    videoUrl:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  },
  {
    id: 5,
    creator: "@crypto_artist",
    caption: "New NFT drop coming soon! What do you think? 🎨",
    likes: 892,
    holders: 67,
    tokensMinted: 1850,
    mintPrice: "0.003",
    boosted: false,
    avatar: "/placeholder.svg?height=40&width=40",
    comments: 15,
    videoUrl:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  },
];

// Mock comments data
const commentsData = [
  {
    id: 1,
    user: "@defi_enthusiast",
    displayName: "DeFi Enthusiast",
    avatar: "/placeholder.svg?height=32&width=32",
    content: "This is amazing! Just minted 10 tokens 🚀",
    timestamp: "1 hour ago",
    likes: 23,
    replies: [
      {
        id: 11,
        user: "@alice_creates",
        displayName: "Alice Creates",
        avatar: "/placeholder.svg?height=32&width=32",
        content: "Thank you! More exciting updates coming soon 🔥",
        timestamp: "45 minutes ago",
        likes: 8,
      },
    ],
  },
  {
    id: 2,
    user: "@token_collector",
    displayName: "Token Collector",
    avatar: "/placeholder.svg?height=32&width=32",
    content:
      "Love the concept! When will you launch on Polygon? This could be a game changer for creators everywhere!",
    timestamp: "2 hours ago",
    likes: 15,
    replies: [],
  },
  {
    id: 3,
    user: "@web3_newbie",
    displayName: "Web3 Newbie",
    avatar: "/placeholder.svg?height=32&width=32",
    content:
      "Can someone explain how the token minting works? I'm new to this 😅",
    timestamp: "3 hours ago",
    likes: 7,
    replies: [
      {
        id: 31,
        user: "@crypto_teacher",
        displayName: "Crypto Teacher",
        avatar: "/placeholder.svg?height=32&width=32",
        content:
          "Each video gets its own ERC-20 token that fans can mint to support creators!",
        timestamp: "2 hours ago",
        likes: 12,
      },
    ],
  },
];

export default function VideoFeed() {
  const [currentVideo, setCurrentVideo] = useState(0);
  const [liked, setLiked] = useState<boolean[]>(
    new Array(videos.length).fill(false)
  );
  const [minting, setMinting] = useState<boolean[]>(
    new Array(videos.length).fill(false)
  );
  const [showComments, setShowComments] = useState(false);
  const [selectedVideoComments, setSelectedVideoComments] = useState<
    number | null
  >(null);
  const [comments, setComments] = useState(commentsData);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [commentLikes, setCommentLikes] = useState<{ [key: number]: boolean }>(
    {}
  );
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [mutedStates, setMutedStates] = useState(
    videos.map((_, i) => i !== 0) // first video unmuted, rest muted
  );
  useEffect(() => {
    sdk.actions.ready({ disableNativeGestures: true });
    console.log("[SDK] Farcaster MiniApp SDK is ready");
  }, []);

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

  const handleLike = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((prev) => {
      const newLiked = [...prev];
      newLiked[index] = !newLiked[index];
      return newLiked;
    });
  }, []);

  const handleMint = useCallback(async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMinting((prev) => {
      const newMinting = [...prev];
      newMinting[index] = true;
      return newMinting;
    });

    setTimeout(() => {
      setMinting((prev) => {
        const newMinting = [...prev];
        newMinting[index] = false;
        return newMinting;
      });
    }, 2000);
  }, []);

  const handleShowComments = useCallback(
    (videoId: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedVideoComments(videoId);
      setShowComments(true);
    },
    []
  );

  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      user: "@current_user",
      displayName: "Current User",
      avatar: "/placeholder.svg?height=32&width=32",
      content: newComment,
      timestamp: "now",
      likes: 0,
      replies: [],
    };

    setComments([comment, ...comments]);
    setNewComment("");
  };

  const handleReplySubmit = (commentId: number) => {
    if (!replyText.trim()) return;

    const reply = {
      id: Date.now(),
      user: "@current_user",
      displayName: "Current User",
      avatar: "/placeholder.svg?height=32&width=32",
      content: replyText,
      timestamp: "now",
      likes: 0,
    };

    setComments(
      comments.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      )
    );
    setReplyText("");
    setReplyingTo(null);
  };

  const handleCommentLike = (commentId: number) => {
    setCommentLikes((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

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

  useEffect(() => {
    setMutedStates(videos.map((_, i) => i !== currentVideo));
  }, [currentVideo]);

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
        {videos.map((video, index) => (
          <div
            key={video.id}
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
                <source src={video.videoUrl} type="video/mp4" />
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
                  <AvatarImage src={video.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {video.creator[1].toUpperCase()}
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
                >
                  <Heart
                    className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      liked[index] ? "fill-current" : ""
                    }`}
                  />
                </Button>
                <span className="text-white text-xs font-medium">
                  {(video.likes + (liked[index] ? 1 : 0)).toLocaleString()}
                </span>
              </div>

              {/* Comments Button */}
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm hover:bg-black/60 hover:scale-110 transition-all duration-200 touch-target"
                  onClick={(e) => handleShowComments(video.id, e)}
                >
                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                <span className="text-white text-xs font-medium">
                  {video.comments}
                </span>
              </div>

              {/* Mint Token Button */}
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:scale-110 transition-all duration-200 disabled:opacity-50 touch-target"
                  onClick={(e) => handleMint(index, e)}
                  disabled={minting[index]}
                >
                  {minting[index] ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
                  )}
                </Button>
                <span className="text-white text-xs font-medium">
                  {video.mintPrice} ETH
                </span>
              </div>

              {/* Share Button */}
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm hover:bg-black/60 hover:scale-110 transition-all duration-200 touch-target"
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
                  {video.creator}
                </span>
                {video.boosted && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs">
                    Boosted
                  </Badge>
                )}
              </div>
              <p className="text-white text-sm leading-relaxed mb-3 line-clamp-2 sm:line-clamp-none">
                {video.caption}
              </p>
              <div className="flex items-center gap-3 sm:gap-4 text-white/80 text-xs">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{video.holders} holders</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    {video.tokensMinted.toLocaleString()} tokens minted
                  </span>
                  <span className="sm:hidden">
                    {(video.tokensMinted / 1000).toFixed(1)}K minted
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
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
      {showComments && selectedVideoComments && (
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
                {comments.length} Comments
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
              {comments.map((comment) => (
                <div key={comment.id} className="animate-fadeIn">
                  {/* Main Comment */}
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                      <AvatarImage src={comment.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-sm">
                        {comment.user[1].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      {/* Comment Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-white text-sm">
                            {comment.user}
                          </span>
                          <span className="text-white/60 text-xs">
                            {comment.timestamp}
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
                          className={`h-7 px-2 text-xs touch-target ${
                            commentLikes[comment.id]
                              ? "text-purple-400 hover:text-purple-300"
                              : "text-white/60 hover:text-white/80"
                          }`}
                          onClick={() => handleCommentLike(comment.id)}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {comment.likes + (commentLikes[comment.id] ? 1 : 0)}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-white/60 hover:text-white/80 text-xs touch-target"
                          onClick={() =>
                            setReplyingTo(
                              replyingTo === comment.id ? null : comment.id
                            )
                          }
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-white/60 hover:text-red-400 text-xs touch-target ml-auto"
                        >
                          <Flag className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Reply Input */}
                      {replyingTo === comment.id && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3 animate-slideUp">
                          <div className="flex gap-2">
                            <Avatar className="w-6 h-6 flex-shrink-0">
                              <AvatarImage src="/placeholder.svg?height=24&width=24" />
                              <AvatarFallback className="text-xs">
                                U
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <Input
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Reply to ${comment.user}...`}
                                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 text-sm h-8 touch-target"
                                onKeyPress={(e) =>
                                  e.key === "Enter" &&
                                  handleReplySubmit(comment.id)
                                }
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyingTo(null)}
                                  className="h-7 px-3 text-white/60 hover:text-white/80 text-xs touch-target"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleReplySubmit(comment.id)}
                                  disabled={!replyText.trim()}
                                  size="sm"
                                  className="h-7 px-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white disabled:opacity-50 text-xs touch-target"
                                >
                                  Reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="space-y-3 border-l-2 border-white/10 pl-4 ml-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="animate-fadeIn">
                              <div className="flex gap-2">
                                <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
                                  <AvatarImage
                                    src={reply.avatar || "/placeholder.svg"}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {reply.user[1].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-white text-xs">
                                      {reply.user}
                                    </span>
                                    <span className="text-white/60 text-xs">
                                      {reply.timestamp}
                                    </span>
                                  </div>
                                  <p className="text-white/90 text-xs leading-relaxed mb-2 break-words">
                                    {reply.content}
                                  </p>

                                  <div className="flex items-center gap-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-1 text-white/60 hover:text-purple-400 text-xs touch-target"
                                    >
                                      <ThumbsUp className="h-2 w-2 mr-1" />
                                      {reply.likes}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-1 text-white/60 hover:text-red-400 text-xs touch-target"
                                    >
                                      <Flag className="h-2 w-2" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {comments.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white/80 mb-2">
                    No comments yet
                  </h3>
                  <p className="text-white/60">
                    Be the first to share your thoughts!
                  </p>
                </div>
              )}
            </div>

            {/* Comment Input - Sticky Bottom */}
            <div className="border-t border-white/10 p-4 bg-gray-900/95 backdrop-blur-lg flex-shrink-0">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback className="text-sm">U</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full px-4 h-10 touch-target"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleCommentSubmit()
                    }
                  />
                  <Button
                    onClick={handleCommentSubmit}
                    disabled={!newComment.trim()}
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
      )}
    </div>
  );
}
