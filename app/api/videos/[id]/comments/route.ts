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
    const comments = await db
      .collection("comments")
      .find({ videoId: id })
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch comments" },
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
    const { fid, username, displayName, pfpUrl, content } = body;
    if (!fid || !username || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const client = await clientPromise;
    const db = client.db("fcreels");
    const comment = {
      videoId: id,
      fid,
      username,
      displayName,
      pfpUrl,
      content,
      createdAt: new Date(),
    };
    const result = await db.collection("comments").insertOne(comment);
    return NextResponse.json({
      success: true,
      commentId: result.insertedId,
      comment,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
