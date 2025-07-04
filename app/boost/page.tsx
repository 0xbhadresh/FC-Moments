"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Zap, TrendingUp, Users, Eye, Check } from "lucide-react";
import Link from "next/link";

const boostOptions = [
  {
    id: "basic",
    name: "Basic Boost",
    price: "$10",
    duration: "2 days",
    reach: "1K-5K",
    features: ["Increased visibility", "Priority in feed", "Basic analytics"],
  },
  {
    id: "premium",
    name: "Premium Boost",
    price: "$25",
    duration: "5 days",
    reach: "5K-15K",
    features: [
      "Maximum visibility",
      "Top of feed placement",
      "Advanced analytics",
      "Cross-platform promotion",
    ],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro Boost",
    price: "$50",
    duration: "7 days",
    reach: "15K-50K",
    features: [
      "Premium placement",
      "Influencer network",
      "Detailed insights",
      "Custom targeting",
    ],
  },
];

export default function BoostPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [boosted, setBoosted] = useState(false);

  const handleBoost = () => {
    setBoosted(true);
    setTimeout(() => {
      setBoosted(false);
      setSelectedPlan(null);
    }, 3000);
  };

  if (boosted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Boost Activated!</h2>
          <p className="text-white/60 max-w-md">
            Your video is now being promoted across the platform. You&apos;ll
            see increased engagement within the next few hours.
          </p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
              Back to Feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold">Boost Campaign</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Boost Your Video</h2>
          <p className="text-white/60 max-w-md mx-auto">
            Amplify your reach and get your content seen by thousands of engaged
            users
          </p>
        </div>

        {/* Current Video Preview */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="w-16 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  Building the future of decentralized social media 🚀
                </h3>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    1,247 views
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    102 holders
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Boost Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Choose Your Boost
          </h3>

          {boostOptions.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedPlan === option.id
                  ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
              onClick={() => setSelectedPlan(option.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    {option.name}
                    {option.popular && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
                        Popular
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {option.price}
                    </div>
                    <div className="text-sm text-white/60">
                      {option.duration}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  <span className="text-white/80 text-sm">
                    Estimated reach: {option.reach} users
                  </span>
                </div>
                <div className="space-y-2">
                  {option.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                      <span className="text-white/70 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Button */}
        {selectedPlan && (
          <div className="sticky bottom-4">
            <Button
              onClick={handleBoost}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white h-12 text-lg font-semibold"
            >
              Boost Video for{" "}
              {boostOptions.find((o) => o.id === selectedPlan)?.price}
            </Button>
          </div>
        )}

        {/* Benefits */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Why Boost?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full" />
              <span className="text-white/80">
                Reach thousands of engaged users
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span className="text-white/80">
                Increase token minting potential
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-white/80">
                Build your creator following
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span className="text-white/80">
                Get detailed performance analytics
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
