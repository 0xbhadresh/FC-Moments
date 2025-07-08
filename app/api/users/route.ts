import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("fcreels");

    const users = await db
      .collection("users")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, username, displayName, pfpUrl, walletAddress } = body;

    const client = await clientPromise;
    const db = client.db("fcreels");

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ fid: fid });

    if (existingUser) {
      // Update existing user
      await db.collection("users").updateOne(
        { fid: fid },
        {
          $set: {
            username,
            displayName,
            pfpUrl,
            walletAddress,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        userId: existingUser._id,
        isNew: false,
      });
    }

    // Create new user
    const user = {
      fid,
      username,
      displayName,
      pfpUrl,
      walletAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalVideos: 0,
      totalViews: 0,
      totalLikes: 0,
      totalTokensMinted: 0,
    };

    const result = await db.collection("users").insertOne(user);

    return NextResponse.json({
      success: true,
      userId: result.insertedId,
      isNew: true,
      user,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create/update user" },
      { status: 500 }
    );
  }
}
