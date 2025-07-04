# Farcaster Reels - Decentralized Video Platform

A decentralized video platform built on Farcaster that allows users to create, mint, and share short-form videos with integrated token creation on Zora.

## Features

- **Video Upload & Storage**: Upload videos to IPFS using Lighthouse
- **Zora Coin Creation**: Create ERC20 coins for videos using Zora protocol
- **Farcaster Integration**: Share videos and coins on Farcaster
- **Mobile-Optimized UI**: Beautiful, responsive design for mobile and desktop
- **Wallet Integration**: Connect with Farcaster Frame wallet

## Zora Coin Creation Integration

The platform integrates with Zora's coin creation protocol to allow creators to mint ERC20 tokens for their videos. Currently, the integration includes:

### Current Implementation

- ✅ Metadata validation using Zora SDK
- ✅ IPFS metadata upload
- ✅ Coin creation parameter setup
- ✅ Wallet connection checks
- ✅ Progress tracking and UI updates

### To Complete the Integration

The coin creation is currently simulated. To enable actual coin creation, you need to:

1. **Set up RPC endpoints** in your environment:

   ```bash
   NEXT_PUBLIC_BASE_RPC_URL=your_base_rpc_url
   ```

2. **Update the `createZoraCoin` function** in `app/upload/page.tsx`:

   ```typescript
   import { createPublicClient, createWalletClient, http } from "viem";
   import { createCoin } from "@zoralabs/coins-sdk";

   const createZoraCoin = async (metadataUri: string) => {
     const publicClient = createPublicClient({
       chain: base,
       transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
     });

     const walletClient = createWalletClient({
       account: address as Hex,
       chain: base,
       transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
     });

     const result = await createCoin(coinParams, walletClient, publicClient, {
       gasMultiplier: 120,
     });

     return result;
   };
   ```

3. **Add the `createCoin` import** back to the imports section.

### Coin Creation Flow

1. **Video Upload**: Video is uploaded to IPFS via Lighthouse
2. **Metadata Creation**: Zora-compliant metadata is created and validated
3. **Metadata Upload**: Metadata is uploaded to IPFS
4. **Coin Creation**: ERC20 coin is created on Zora protocol
5. **Success**: User receives transaction hash and coin address

### Supported Chains

- **Base Mainnet** (default) - Uses ZORA token for trading
- **Optimism** - Uses ETH for trading
- **Ethereum** - Uses ETH for trading

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up environment variables:

   ```bash
   NEXT_PUBLIC_APP_URL=your_app_url
   NEXT_PUBLIC_BASE_RPC_URL=your_base_rpc_url
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Viem, Wagmi
- **Storage**: IPFS via Lighthouse
- **Token Creation**: Zora Coins SDK
- **Social**: Farcaster Frame SDK

## License

MIT
