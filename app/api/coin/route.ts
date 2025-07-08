import { NextRequest, NextResponse } from "next/server";
import {
  createCoin,
  DeployCurrency,
  ValidMetadataURI,
} from "@zoralabs/coins-sdk";
import {
  createWalletClient,
  createPublicClient,
  http,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// NEVER commit your private key to version control!
const PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string; // e.g., "https://mainnet.base.org"

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

const account = privateKeyToAccount(PRIVATE_KEY);

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(RPC_URL),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[API/coin] Incoming body:", body);
    // Validate required fields
    const { name, symbol, payoutRecipient, platformReferrer, currency } = body;
    // Always use the static metadata URI
    const uri =
      "ipfs://bafkreiavd4zpnrn36hbkr3imkb23jaampbs2axbrgvf6qagpqy7osfs7nu";
    if (!name || !symbol || !uri || !payoutRecipient) {
      console.warn("[API/coin] Missing required fields", {
        name,
        symbol,
        uri,
        payoutRecipient,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const coinParams = {
      name,
      symbol,
      uri: uri as ValidMetadataURI,
      payoutRecipient: payoutRecipient as Address,
      platformReferrer: platformReferrer as Address | undefined,
      chainId: base.id,
      currency: currency || DeployCurrency.ZORA,
    };
    console.log("[API/coin] coinParams:", coinParams);

    const result = await createCoin(coinParams, walletClient, publicClient, {
      gasMultiplier: 120, // Optional: 20% gas buffer
    });
    console.log("[API/coin] createCoin result:", result);

    return NextResponse.json({
      hash: result.hash,
      address: result.address,
      deployment: result.deployment,
    });
  } catch (error) {
    console.error("[API/coin] Error creating coin:", error);
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : "Internal server error") ||
          "Internal server error",
      },
      { status: 500 }
    );
  }
}
