"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Copy, Share, Users, Gift, Check } from "lucide-react"
import Link from "next/link"

export default function InvitePage() {
  const [copied, setCopied] = useState(false)
  const inviteCode = "FARCASTER2024"
  const invitesUsed = 3
  const totalInvites = 10

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`Join Farcaster Reels with my invite code: ${inviteCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Invite Friends</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Invite Friends to Farcaster Reels</h2>
          <p className="text-white/60 max-w-md mx-auto">
            Share your unique invite code and help grow the decentralized creator economy
          </p>
        </div>

        {/* Invite Code Card */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-center text-white">Your Invite Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                value={inviteCode}
                readOnly
                className="text-center text-lg font-mono bg-white/5 border-white/20 text-white pr-12"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <Button
              onClick={handleCopy}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              {copied ? "Copied!" : "Copy Invite Code"}
            </Button>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-purple-400" />
                <div>
                  <h3 className="font-semibold text-white">Invites Used</h3>
                  <p className="text-white/60 text-sm">Track your referrals</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {invitesUsed}/{totalInvites}
                </div>
                <div className="w-24 h-2 bg-white/20 rounded-full mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${(invitesUsed / totalInvites) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Options */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Share via</h3>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 border-white/20 text-white hover:bg-white/10 h-12 bg-transparent"
          >
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <Share className="h-4 w-4 text-white" />
            </div>
            Share to Farcaster
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 border-white/20 text-white hover:bg-white/10 h-12 bg-transparent"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Share className="h-4 w-4 text-white" />
            </div>
            Share to Twitter
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 border-white/20 text-white hover:bg-white/10 h-12 bg-transparent"
          >
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Share className="h-4 w-4 text-white" />
            </div>
            Share via Message
          </Button>
        </div>

        {/* Benefits */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Invite Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full" />
              <span className="text-white/80">Earn tokens when friends mint</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span className="text-white/80">Build your creator network</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-white/80">Unlock exclusive features</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
