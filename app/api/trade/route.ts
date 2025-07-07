import { NextRequest, NextResponse } from "next/server";
import { tradeCoin, TradeParameters } from "@zoralabs/coins-sdk";
import { parseEther, createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

export async function POST(request: NextRequest) {
  try {
    const { coinAddress, amount } = await request.json();
    if (!coinAddress || !amount) {
      return NextResponse.json(
        { error: "Missing coinAddress or amount" },
        { status: 400 }
      );
    }
    // Get private key and RPC URL from env
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL;
    if (!PRIVATE_KEY || !BASE_RPC_URL) {
      return NextResponse.json(
        { error: "Server misconfigured: missing PRIVATE_KEY or BASE_RPC_URL" },
        { status: 500 }
      );
    }
    const account = privateKeyToAccount(PRIVATE_KEY);
    const publicClient = createPublicClient({
      chain: base,
      transport: http(BASE_RPC_URL),
    });
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(BASE_RPC_URL),
    });
    const tradeParameters: TradeParameters = {
      sell: { type: "eth" },
      buy: { type: "erc20", address: coinAddress },
      amountIn: parseEther(amount),
      slippage: 0.05,
      sender: account.address,
    };
    const receipt = await tradeCoin({
      tradeParameters,
      walletClient,
      account,
      publicClient,
    });
    return NextResponse.json({ txHash: receipt.transactionHash });
  } catch (err: unknown) {
    let message = "Trade failed";
    if (err && typeof err === "object" && "message" in err) {
      message = (err as { message?: string }).message || message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
