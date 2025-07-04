import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("fcreels");

    const user = await db
      .collection("users")
      .findOne({ fid: parseInt(params.fid) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's videos
    const videos = await db
      .collection("videos")
      .find({ "creatorInfo.fid": parseInt(params.fid) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      user: {
        ...user,
        videos,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("fcreels");

    const result = await db.collection("users").updateOne(
      { fid: parseInt(params.fid) },
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
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
