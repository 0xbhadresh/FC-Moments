"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Heart,
  Share,
  Zap,
  ArrowLeft,
  MessageCircle,
  Users,
  Send,
  MoreVertical,
  Flag,
  ThumbsUp,
  Reply,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { sdk } from "@farcaster/frame-sdk";

// Mock video data - in real app this would come from API
const videoData = {
  1: {
    id: 1,
    creator: "@alice_creates",
    displayName: "Alice Creates",
    caption: "Building the future of decentralized social media 🚀",
    likes: 1247,
    holders: 102,
    tokensMinted: 2300,
    mintPrice: "0.005",
    boosted: true,
    avatar: "/placeholder.svg?height=40&width=40",
    videoUrl:
      "https://www.riotgames.com/darkroom/original/eedccd01fe642a9a6f5b5a4725c3c1c7:cab5f0653154a0cf9a07d7dc3334a71e/rg-brand-cinematic.mp4",
    timestamp: "2 hours ago",
  },
  2: {
    id: 2,
    creator: "@crypto_artist",
    displayName: "Crypto Artist",
    caption: "New NFT drop coming soon! What do you think? 🎨",
    likes: 892,
    holders: 67,
    tokensMinted: 1850,
    mintPrice: "0.003",
    boosted: false,
    avatar: "/placeholder.svg?height=40&width=40",
    videoUrl:
      "https://www.riotgames.com/darkroom/original/eedccd01fe642a9a6f5b5a4725c3c1c7:cab5f0653154a0cf9a07d7dc3334a71e/rg-brand-cinematic.mp4",
    timestamp: "5 hours ago",
  },
  3: {
    id: 3,
    creator: "@web3_builder",
    displayName: "Web3 Builder",
    caption: "Just shipped a new DeFi protocol. AMA! 💻",
    likes: 2156,
    holders: 234,
    tokensMinted: 4200,
    mintPrice: "0.008",
    boosted: true,
    avatar: "/placeholder.svg?height=40&width=40",
    videoUrl:
      "https://www.riotgames.com/darkroom/original/eedccd01fe642a9a6f5b5a4725c3c1c7:cab5f0653154a0cf9a07d7dc3334a71e/rg-brand-cinematic.mp4",
    timestamp: "1 day ago",
  },
};

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
      {
        id: 32,
        user: "@web3_newbie",
        displayName: "Web3 Newbie",
        avatar: "/placeholder.svg?height=32&width=32",
        content: "@crypto_teacher Thanks! That makes sense now 🙏",
        timestamp: "2 hours ago",
        likes: 3,
      },
    ],
  },
  {
    id: 4,
    user: "@nft_artist",
    displayName: "NFT Artist",
    avatar: "/placeholder.svg?height=32&width=32",
    content: "The future is here! Already planning my next video drop 🎨✨",
    timestamp: "4 hours ago",
    likes: 31,
    replies: [],
  },
  {
    id: 5,
    user: "@dao_member",
    displayName: "DAO Member",
    avatar: "/placeholder.svg?height=32&width=32",
    content: "This could revolutionize creator monetization. Bullish! 📈",
    timestamp: "6 hours ago",
    likes: 19,
    replies: [],
  },
];

export default function VideoPage() {
  const params = useParams();
  const videoId = Number(params.id);
  const video = videoData[videoId as keyof typeof videoData];

  const [liked, setLiked] = useState(false);
  const [minting, setMinting] = useState(false);
  const [comments, setComments] = useState(commentsData);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [commentLikes, setCommentLikes] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentsModalRef = useRef<HTMLDivElement>(null);

  /**
   * Autoplay video when the component mounts.
   * We guard against the common AbortError that fires if the
   * element is removed (e.g. during fast navigation or refresh).
   */
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const playSafely = async () => {
      try {
        // Some mobile browsers return a promise we must await / catch
        await videoEl.play();
      } catch {
        /* ignore AbortError & other benign rejections */
      }
    };

    playSafely();

    // Pause on unmount to avoid dangling playbacks
    return () => {
      try {
        videoEl.pause();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    if (showComments && commentInputRef.current) {
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 300);
    }
  }, [showComments]);

  useEffect(() => {
    sdk.actions.ready({ disableNativeGestures: true });
  }, []);

  // Handle backdrop click to close comments
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowComments(false);
    }
  };

  if (!video) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Video Not Found
          </h2>
          <p className="text-white/60 mb-4 text-sm sm:text-base">
            The video you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white touch-target">
              Back to Feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleLike = () => {
    setLiked(!liked);
  };

  const handleMint = async () => {
    setMinting(true);
    setTimeout(() => {
      setMinting(false);
    }, 2000);
  };

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

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Header - Mobile Optimized */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-lg border-b border-white/10 safe-area-top">
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 touch-target flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                <AvatarImage src={video.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {video.creator[1].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm sm:text-base truncate">
                {video.creator}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 touch-target flex-shrink-0"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Video Section - Full Screen */}
      <div className="relative h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)]">
        <div className="w-full h-full bg-black relative overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            loop
            playsInline
            controls
          >
            <source src={video.videoUrl} type="video/mp4" />
          </video>

          {/* Video Overlay Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white font-semibold text-sm sm:text-base">
                {video.creator}
              </span>
              {video.boosted && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs">
                  Boosted
                </Badge>
              )}
              <span className="text-white/60 text-xs sm:text-sm">
                • {video.timestamp}
              </span>
            </div>
            <p className="text-white text-sm leading-relaxed mb-3 line-clamp-2">
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

          {/* Right Side Controls */}
          <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 sm:gap-6 z-30">
            {/* Like Button */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 touch-target ${
                  liked
                    ? "bg-red-500/80 text-white hover:bg-red-500"
                    : "bg-black/40 text-white hover:bg-black/60"
                }`}
                onClick={handleLike}
              >
                <Heart
                  className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    liked ? "fill-current" : ""
                  }`}
                />
              </Button>
              <span className="text-white text-xs font-medium">
                {(video.likes + (liked ? 1 : 0)).toLocaleString()}
              </span>
            </div>

            {/* Comments Button */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm hover:bg-black/60 hover:scale-110 transition-all duration-200 touch-target"
                onClick={() => setShowComments(true)}
              >
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <span className="text-white text-xs font-medium">
                {comments.length}
              </span>
            </div>

            {/* Mint Token Button */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:scale-110 transition-all duration-200 disabled:opacity-50 touch-target"
                onClick={handleMint}
                disabled={minting}
              >
                {minting ? (
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
          </div>
        </div>
      </div>

      {/* Comments Modal - Bottom Popup */}
      {showComments && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div
            ref={commentsModalRef}
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
                onClick={() => setShowComments(false)}
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
