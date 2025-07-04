import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("fcreels");

    const videos = await db
      .collection("videos")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ videos });
  
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      videoCid,
      metadataCid,
      tokenData,
      creatorInfo,
      transactionHash,
      coinAddress,
    } = body;

    const client = await clientPromise;
    const db = client.db("fcreels");

    const video = {
      title,
      description,
      videoCid,
      metadataCid,
      tokenData,
      creatorInfo,
      transactionHash,
      coinAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      likes: 0,
      shares: 0,
    };

    const result = await db.collection("videos").insertOne(video);

    return NextResponse.json({
      success: true,
      videoId: result.insertedId,
      video,
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
