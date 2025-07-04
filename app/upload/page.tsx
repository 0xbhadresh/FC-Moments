"use client";

import type React from "react";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Upload,
  Play,
  Trash2,
  RefreshCw,
  Zap,
  Share,
  Check,
  X,
  Plus,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { sdk } from "@farcaster/frame-sdk";

import { pinata } from "@/utils/config";
import { validateMetadataJSON } from "@zoralabs/coins-sdk";
import { useAccount } from "wagmi";

type UploadStep =
  | "upload"
  | "details"
  | "token"
  | "launch"
  | "success"
  | "error";

interface VideoFile {
  file: File;
  url: string;
  duration: number;
  size: string;
  resolution: string;
  cid?: string; // IPFS CID after upload
}

interface TokenData {
  name: string;
  symbol: string;
  supply: number;
  price: string;
  chain: string;
  royalties: boolean;
}

interface VideoData {
  title: string;
  description: string;
  tags: string[];
}

// Zora metadata interface following EIP-7572
interface ZoraMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  content?: {
    mime: string;
    uri: string;
  };
  properties: {
    category: string;
    creator: string;
    duration?: number;
    resolution?: string;
    tags?: string[];
    tokenSymbol?: string;
    tokenSupply?: number;
    tokenPrice?: string;
    chain?: string;
    royalties?: boolean;
    timestamp: string;
    version: string;
  };
}

const chains = [
  { id: "base", name: "Base", icon: "🔵" },
  { id: "optimism", name: "Optimism", icon: "🔴" },
  { id: "ethereum", name: "Ethereum", icon: "⚡" },
];

export default function UploadPage() {
  const [currentStep, setCurrentStep] = useState<UploadStep>("upload");
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [videoData, setVideoData] = useState<VideoData>({
    title: "",
    description: "",
    tags: [],
  });
  const [tokenData, setTokenData] = useState<TokenData>({
    name: "",
    symbol: "",
    supply: 100,
    price: "0.005",
    chain: "base",
    royalties: false,
  });
  const [tagInput, setTagInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [transactionHash, setTransactionHash] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [metadataCid, setMetadataCid] = useState<string>("");
  const [coinAddress, setCoinAddress] = useState<string>("");
  const [videoId, setVideoId] = useState<string>("");
  const [farcasterUser, setFarcasterUser] = useState<{
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Wallet integration (removed for API-based coin creation)
  const { address, isConnected } = useAccount();

  useEffect(() => {
    sdk.actions.ready({ disableNativeGestures: true });
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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      const videoElement = document.createElement("video");

      videoElement.onloadedmetadata = () => {
        const duration = Math.round(videoElement.duration);
        const size = (file.size / (1024 * 1024)).toFixed(1) + " MB";
        const resolution = `${videoElement.videoWidth}x${videoElement.videoHeight}`;

        setVideo({
          file,
          url,
          duration,
          size,
          resolution,
        });
        setCurrentStep("details");
      };

      videoElement.src = url;
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const addTag = () => {
    if (tagInput.trim() && !videoData.tags.includes(tagInput.trim())) {
      setVideoData((prev: VideoData) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setVideoData((prev: VideoData) => ({
      ...prev,
      tags: prev.tags.filter((tag: string) => tag !== tagToRemove),
    }));
  };

  const uploadToPinata = async (file: File) => {
    try {
      setProgress(0);
      setUploadError(null);
      console.log("File:", file);

      // Get signed upload URL from our API
      console.log("📞 Getting signed upload URL...");
      setProgress(10);
      const urlRequest = await fetch("/api/url");

      if (!urlRequest.ok) {
        throw new Error("Failed to get signed upload URL from API");
      }

      const urlResponse = await urlRequest.json();

      if (!urlResponse.url) {
        throw new Error("Failed to get signed upload URL");
      }

      console.log("✅ Got signed upload URL, uploading file...");
      setProgress(30);

      // Upload file using Pinata with signed URL
      const upload = await pinata.upload.public.file(file).url(urlResponse.url);

      setProgress(100);
      console.log("✅ File uploaded successfully to Pinata!");
      console.log("📋 Upload result:", upload);
      console.log("🔗 CID:", upload.cid);
      console.log(
        "🌐 Visit at:",
        `https://gateway.pinata.cloud/ipfs/${upload.cid}`
      );

      return upload.cid; // Return the CID
    } catch (error) {
      console.error("Upload error:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("Failed to get signed upload URL")) {
          throw new Error(
            "Failed to initialize upload. Please check your Pinata configuration."
          );
        }
        if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          throw new Error(
            "Network error during upload. Please check your internet connection."
          );
        }
      }

      throw new Error("Failed to upload file to IPFS");
    }
  };

  const createZoraMetadata = (videoCid: string): ZoraMetadata => {
    const creatorInfo = farcasterUser
      ? farcasterUser.username
        ? `@${farcasterUser.username}`
        : `@fid_${farcasterUser.fid}`
      : "@alice_creates";

    const metadata: ZoraMetadata = {
      name: videoData.title,
      description: videoData.description || videoData.title,
      image: `ipfs://${videoCid}`, // For video NFTs, image can be the video thumbnail or video itself
      animation_url: `ipfs://${videoCid}`, // Video file
      content: {
        mime: video?.file.type || "video/mp4",
        uri: `ipfs://${videoCid}`,
      },
      properties: {
        category: "social",
        creator: creatorInfo,
        duration: video?.duration,
        resolution: video?.resolution,
        tags: videoData.tags,
        tokenSymbol: tokenData.symbol,
        tokenSupply: tokenData.supply,
        tokenPrice: tokenData.price,
        chain: "base",
        royalties: false,
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    };

    return metadata;
  };

  const validateAndUploadMetadata = async (
    metadata: ZoraMetadata
  ): Promise<string> => {
    try {
      // Validate metadata using Zora SDK
      validateMetadataJSON(metadata);
      console.log("Metadata validation passed ✅");

      // Upload metadata to IPFS
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: "application/json",
      });
      const metadataFile = new File([metadataBlob], "metadata.json", {
        type: "application/json",
      });

      const metadataCid = await uploadToPinata(metadataFile);
      console.log("Metadata uploaded to IPFS:", metadataCid);

      if (!metadataCid) {
        throw new Error("Failed to upload metadata to IPFS");
      }

      return metadataCid;
    } catch (error) {
      console.error("Metadata validation failed:", error);
      throw new Error(
        `Metadata validation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const createCoinViaApi = async (metadataUri: string) => {
    try {
      const response = await fetch("/api/coin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tokenData.name,
          symbol: tokenData.symbol,
          uri: `ipfs://${metadataUri}`,
          payoutRecipient: address,
          platformReferrer: process.env.NEXT_PUBLIC_PLATFORM_REFERRER,
          currency: 1,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create coin");
      return data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to create coin"
      );
    }
  };

  const postVideoToAPI = async (
    videoCid: string,
    metadataCid: string,
    transactionHash: string,
    coinAddress: string
  ) => {
    try {
      const creatorInfo = {
        fid: farcasterUser?.fid || 0,
        username: farcasterUser?.username || "",
        displayName: farcasterUser?.displayName || "",
        pfpUrl: farcasterUser?.pfpUrl || "",
        walletAddress: address || "",
      };

      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: videoData.title,
          description: videoData.description,
          videoCid,
          metadataCid,
          tokenData,
          creatorInfo,
          transactionHash,
          coinAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post video");
      }

      const result = await response.json();
      console.log("Video posted successfully:", result);
      return result;
    } catch (error) {
      console.error("Error posting video:", error);
      throw new Error(
        `Failed to post video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleLaunch = async () => {
    if (!video) {
      setUploadError("No video selected");
      setCurrentStep("error");
      return;
    }

    setCurrentStep("launch");
    setProgress(0);
    setUploadError(null);

    try {
      // Step 1: Upload video to IPFS
      setProgress(5);
      const videoCid = await uploadToPinata(video.file);

      // Update video object with CID
      setVideo((prev) => (prev ? { ...prev, cid: videoCid } : null));
      setProgress(40);

      // Step 2: Create and validate Zora metadata
      setProgress(50);
      const metadata = createZoraMetadata(videoCid!);
      const metadataCid = await validateAndUploadMetadata(metadata);
      setMetadataCid(metadataCid);
      setProgress(70);

      // Step 3: Create coin via API
      setProgress(75);
      const coinResult = await createCoinViaApi(metadataCid);
      if (coinResult.hash) setTransactionHash(coinResult.hash);
      if (coinResult.address) setCoinAddress(coinResult.address);
      setProgress(85);

      // Step 4: Post video to API
      setProgress(95);
      try {
        const apiResult = await postVideoToAPI(
          videoCid!,
          metadataCid,
          coinResult.hash,
          coinResult.address || ""
        );
        if (apiResult.videoId) {
          setVideoId(apiResult.videoId.toString());
        }
      } catch (apiError) {
        console.warn("API call failed but coin was created:", apiError);
        // Don't fail the entire flow if API call fails, since coin was created successfully
        // The user can still view their coin on Zora
      }
      setProgress(100);

      setCurrentStep("success");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      setCurrentStep("error");
    }
  };

  const resetFlow = () => {
    setCurrentStep("upload");
    setVideo(null);
    setVideoData({ title: "", description: "", tags: [] });
    setTokenData({
      name: "",
      symbol: "",
      supply: 100,
      price: "0.005",
      chain: "base",
      royalties: false,
    });
    setProgress(0);
    setTransactionHash("");
    setUploadError(null);
    setMetadataCid("");
    setCoinAddress("");
    setVideoId("");
  };

  if (currentStep === "success") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm sm:max-w-md animate-fadeIn">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Video Published & Coin Created!
          </h2>
          <p className="text-white/60 text-sm sm:text-base">
            {videoId
              ? "Your video is now live on Farcaster Reels and your coin is available on Zora."
              : "Your coin was created successfully on Zora! The video will be available on the feed shortly."}
          </p>

          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4 text-left">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-white/80">Token:</span>
                <span className="font-mono text-white">{tokenData.symbol}</span>
              </div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-white/80">Chain:</span>
                <span className="text-white capitalize">{tokenData.chain}</span>
              </div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-white/80">Video CID:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                  onClick={() =>
                    window.open(
                      `https://gateway.pinata.cloud/ipfs/${video?.cid}`,
                      "_blank"
                    )
                  }
                >
                  <span className="font-mono text-xs">
                    {video?.cid?.slice(0, 8)}...
                  </span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-white/80">Metadata CID:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                  onClick={() =>
                    window.open(
                      `https://gateway.pinata.cloud/ipfs/${metadataCid}`,
                      "_blank"
                    )
                  }
                >
                  <span className="font-mono text-xs">
                    {metadataCid.slice(0, 8)}...
                  </span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Transaction:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                  onClick={() =>
                    window.open(
                      `https://basescan.org/tx/${transactionHash}`,
                      "_blank"
                    )
                  }
                >
                  <span className="font-mono text-xs">
                    {transactionHash.slice(0, 8)}...
                  </span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Coin Address:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                  onClick={() =>
                    window.open(
                      `https://basescan.org/address/${coinAddress}`,
                      "_blank"
                    )
                  }
                >
                  <span className="font-mono text-xs">
                    {coinAddress.slice(0, 8)}...
                  </span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">View on Zora:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-400 hover:text-purple-300 p-0 h-auto"
                  onClick={() =>
                    window.open(
                      `https://zora.co/coin/base:${coinAddress}`,
                      "_blank"
                    )
                  }
                >
                  <span className="text-xs">Trade Coin</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
              {videoId && typeof videoId === "string" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">Video ID:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                    onClick={() => window.open(`/video/${videoId}`, "_blank")}
                  >
                    <span className="font-mono text-xs">
                      {videoId.slice(0, 8)}...
                    </span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white touch-target"
              onClick={() =>
                window.open(
                  `https://zora.co/coin/base:${coinAddress}`,
                  "_blank"
                )
              }
            >
              <Share className="h-4 w-4 mr-2" />
              View on Zora
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent touch-target"
              onClick={() =>
                window.open(
                  `https://basescan.org/tx/${transactionHash}`,
                  "_blank"
                )
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Transaction
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {videoId ? (
              <Link href={`/video/${videoId}`} className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent touch-target"
                >
                  View Video
                </Button>
              </Link>
            ) : (
              <Link href="/" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent touch-target"
                >
                  View Feed
                </Button>
              </Link>
            )}
          </div>

          <Button
            variant="ghost"
            onClick={resetFlow}
            className="text-white/60 hover:text-white touch-target"
          >
            Upload Another Video
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === "error") {
    const isTransactionRejected = uploadError?.includes(
      "Transaction was rejected"
    );

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm sm:max-w-md animate-fadeIn">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            {isTransactionRejected ? "Transaction Rejected" : "Upload Failed"}
          </h2>
          <p className="text-white/60 text-sm sm:text-base">
            {isTransactionRejected
              ? "You rejected the transaction in your wallet. To create your coin, you need to approve the transaction when prompted."
              : uploadError ||
                "Something went wrong while uploading your video or minting the token. Please try again."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setCurrentStep("launch")}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white touch-target"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isTransactionRejected ? "Try Again" : "Retry"}
            </Button>
            <Button
              variant="outline"
              onClick={resetFlow}
              className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent touch-target"
            >
              Start Over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "launch") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm sm:max-w-md animate-fadeIn">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Publishing Your Video
          </h2>
          <p className="text-white/60 text-sm sm:text-base">
            {progress < 10
              ? "Getting upload URL..."
              : progress < 40
              ? "Uploading video to IPFS..."
              : progress < 50
              ? "Creating metadata..."
              : progress < 70
              ? "Validating metadata..."
              : progress < 75
              ? "Creating coin on Zora..."
              : progress < 85
              ? "Confirming transaction..."
              : "Finalizing..."}
          </p>

          <div className="space-y-2">
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-white/60">{progress}% complete</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4 text-left">
            <div className="space-y-2 text-sm">
              <div
                className={`flex items-center gap-2 ${
                  progress > 5 ? "text-green-400" : "text-white/60"
                }`}
              >
                {progress > 5 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="w-4 h-4 border border-white/40 rounded-full" />
                )}
                Get upload URL
              </div>
              <div
                className={`flex items-center gap-2 ${
                  progress > 40 ? "text-green-400" : "text-white/60"
                }`}
              >
                {progress > 40 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="w-4 h-4 border border-white/40 rounded-full" />
                )}
                Upload video to IPFS
              </div>
              <div
                className={`flex items-center gap-2 ${
                  progress > 50 ? "text-green-400" : "text-white/60"
                }`}
              >
                {progress > 50 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="w-4 h-4 border border-white/40 rounded-full" />
                )}
                Create metadata
              </div>
              <div
                className={`flex items-center gap-2 ${
                  progress > 70 ? "text-green-400" : "text-white/60"
                }`}
              >
                {progress > 70 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="w-4 h-4 border border-white/40 rounded-full" />
                )}
                Validate metadata
              </div>
              <div
                className={`flex items-center gap-2 ${
                  progress > 75 ? "text-green-400" : "text-white/60"
                }`}
              >
                {progress > 75 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="w-4 h-4 border border-white/40 rounded-full" />
                )}
                Create coin on{" "}
                {
                  chains.find(
                    (c: { id: string; name: string; icon: string }) =>
                      c.id === tokenData.chain
                  )?.name
                }
              </div>
              <div
                className={`flex items-center gap-2 ${
                  progress > 85 ? "text-green-400" : "text-white/60"
                }`}
              >
                {progress > 85 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="w-4 h-4 border border-white/40 rounded-full" />
                )}
                Confirm transaction
              </div>
              <div
                className={`flex items-center gap-2 ${
                  progress > 90 ? "text-green-400" : "text-white/60"
                }`}
              >
                {progress > 90 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="w-4 h-4 border border-white/40 rounded-full" />
                )}
                Publish to feed
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header - Mobile Optimized */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-lg border-b border-white/10 safe-area-top">
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 touch-target"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold">Upload Video</h1>
          </div>

          {/* Wallet Connection & Progress Steps - Mobile Optimized */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Farcaster User Info */}
            {farcasterUser && (
              <div className="flex items-center gap-2 text-xs text-white/60">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                <span className="hidden sm:block">
                  {farcasterUser.username
                    ? `@${farcasterUser.username}`
                    : `FID: ${farcasterUser.fid}`}
                </span>
              </div>
            )}

            {/* Wallet Connection */}
            {/* Wallet connection UI removed for API-based coin creation */}

            {/* Progress Steps */}
            <div className="flex items-center gap-1 sm:gap-2">
              {["upload", "details", "token"].map((step, index) => (
                <div
                  key={step}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                    currentStep === step
                      ? "bg-green-500"
                      : ["upload", "details", "token"].indexOf(currentStep) >
                        index
                      ? "bg-green-500"
                      : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6 safe-area-bottom">
        {/* Step 1: Video Upload - Mobile Optimized */}
        {currentStep === "upload" && (
          <Card className="bg-white/5 border-white/10 animate-fadeIn">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-white text-lg sm:text-xl">
                Upload Your Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-white/20 rounded-lg p-6 sm:p-8 text-center hover:border-purple-500/50 transition-colors cursor-pointer touch-target"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-white/40 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                  Drop your video here
                </h3>
                <p className="text-white/60 mb-3 sm:mb-4 text-sm sm:text-base">
                  or tap to browse files
                </p>
                <p className="text-xs sm:text-sm text-white/40">
                  Supports MP4, MOV • Max 60 seconds • Up to 100MB
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/mov"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Video Details - Mobile Optimized */}
        {currentStep === "details" && video && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            {/* Video Preview - Mobile Optimized */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <div className="relative w-20 h-24 sm:w-24 sm:h-32 bg-black rounded-lg overflow-hidden flex-shrink-0">
                    <video
                      ref={videoRef}
                      src={video.url}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      playsInline
                    >
                      <source src={video.url} type={video.file.type} />
                    </video>
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white text-sm sm:text-base">
                        Video Preview
                      </h3>
                      <div className="flex gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/60 hover:text-white hover:bg-white/10 w-8 h-8 sm:w-10 sm:h-10 touch-target"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 w-8 h-8 sm:w-10 sm:h-10 touch-target"
                          onClick={() => setCurrentStep("upload")}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm text-white/60 space-y-1">
                      <div>Duration: {video.duration}s</div>
                      <div>Size: {video.size}</div>
                      <div className="truncate">
                        Resolution: {video.resolution}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Details Form - Mobile Optimized */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-white text-lg sm:text-xl">
                  Add Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label
                    htmlFor="title"
                    className="text-white text-sm sm:text-base"
                  >
                    Video Title
                  </Label>
                  <Input
                    id="title"
                    value={videoData.title}
                    onChange={(e) =>
                      setVideoData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Give your video a catchy title..."
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 mt-1 touch-target"
                    maxLength={80}
                  />
                  <div className="text-xs text-white/40 mt-1">
                    {videoData.title.length}/80 characters
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="description"
                    className="text-white text-sm sm:text-base"
                  >
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    value={videoData.description}
                    onChange={(e) =>
                      setVideoData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Tell viewers about your video..."
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[80px] mt-1 touch-target"
                  />
                </div>

                <div>
                  <Label className="text-white text-sm sm:text-base">
                    Tags (Optional)
                  </Label>
                  <div className="flex gap-2 mb-2 mt-1">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag..."
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40 touch-target"
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                    />
                    <Button
                      onClick={addTag}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 bg-transparent touch-target flex-shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {videoData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {videoData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                        >
                          {tag}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 p-0 hover:bg-transparent touch-target"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-sm text-white/80">
                    Creator:{" "}
                    <span className="font-semibold">
                      {farcasterUser ? (
                        <>
                          {farcasterUser.username
                            ? `@${farcasterUser.username}`
                            : `@fid_${farcasterUser.fid}`}
                          {farcasterUser.displayName && (
                            <span className="text-white/60 ml-2">
                              ({farcasterUser.displayName})
                            </span>
                          )}
                        </>
                      ) : (
                        "@alice_creates"
                      )}
                    </span>
                  </div>
                  {farcasterUser && (
                    <div className="text-xs text-white/60 mt-1">
                      FID: {farcasterUser.fid}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setCurrentStep("token")}
                  disabled={!videoData.title.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white disabled:opacity-50 touch-target"
                >
                  Continue to Token Setup
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Token Creation - Mobile Optimized */}
        {currentStep === "token" && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                  Create Coin for This Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="tokenName"
                      className="text-white text-sm sm:text-base"
                    >
                      Coin Name
                    </Label>
                    <Input
                      id="tokenName"
                      value={tokenData.name}
                      onChange={(e) =>
                        setTokenData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., VibeDrop"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40 mt-1 touch-target"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="tokenSymbol"
                      className="text-white text-sm sm:text-base"
                    >
                      Coin Symbol
                    </Label>
                    <Input
                      id="tokenSymbol"
                      value={tokenData.symbol}
                      onChange={(e) =>
                        setTokenData((prev) => ({
                          ...prev,
                          symbol: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="e.g., VIBE"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40 mt-1 touch-target"
                      maxLength={6}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Token Preview - Mobile Optimized */}
            <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-white text-lg sm:text-xl">
                  Coin Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm sm:text-base">
                  <span className="text-white/80">Name:</span>
                  <span className="font-semibold text-white truncate ml-2">
                    {tokenData.name || "Coin Name"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm sm:text-base">
                  <span className="text-white/80">Symbol:</span>
                  <span className="font-mono text-white">
                    {tokenData.symbol || "SYMBOL"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm sm:text-base">
                  <span className="text-white/80">Chain:</span>
                  <span className="text-white">Base</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("details")}
                className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent touch-target"
              >
                Back
              </Button>
              <Button
                onClick={handleLaunch}
                disabled={!tokenData.name || !tokenData.symbol || !isConnected}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white disabled:opacity-50 touch-target"
              >
                <Zap className="h-4 w-4 mr-2" />
                Mint & Publish
              </Button>
            </div>
            {!isConnected && (
              <div className="text-center text-red-400 text-sm mt-2">
                Please connect your wallet to mint and publish your coin.
              </div>
            )}
            <div className="mb-2 text-center text-white/80 text-sm">
              {isConnected && address ? (
                <>
                  Connected wallet: <span className="font-mono">{address}</span>
                </>
              ) : (
                <>No wallet connected</>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
