import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const client = await clientPromise;
    const db = client.db("fcreels");
    const likes = await db
      .collection("likes")
      .find({ videoId: id, liked: true })
      .toArray();
    return NextResponse.json({ likes, count: likes.length });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch likes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { fid, username, displayName, pfpUrl, liked } = body;
    if (!fid || !username || typeof liked !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const client = await clientPromise;
    const db = client.db("fcreels");
    const filter = { videoId: id, fid };
    const update = {
      $set: {
        username,
        displayName,
        pfpUrl,
        liked,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    };
    await db.collection("likes").updateOne(filter, update, { upsert: true });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update like" },
      { status: 500 }
    );
  }
}
