import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fid: string }> }
) {
  try {
    const { fid } = await context.params;
    const client = await clientPromise;
    const db = client.db("fcreels");

    const user = await db.collection("users").findOne({ fid: parseInt(fid) });

    // Get user's videos regardless of user existence
    const videos = await db
      .collection("videos")
      .find({ "creatorInfo.fid": parseInt(fid) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      user,
      videos,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user/videos" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ fid: string }> }
) {
  try {
    const { fid } = await context.params;
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("fcreels");

    const result = await db.collection("users").updateOne(
      { fid: parseInt(fid) },
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
