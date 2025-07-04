import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("fcreels");

    // Get total videos
    const totalVideos = await db.collection("videos").countDocuments();

    // Get total users
    const totalUsers = await db.collection("users").countDocuments();

    // Get total views
    const totalViews = await db
      .collection("videos")
      .aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }])
      .toArray();

    // Get total likes
    const totalLikes = await db
      .collection("videos")
      .aggregate([{ $group: { _id: null, total: { $sum: "$likes" } } }])
      .toArray();

    // Get recent videos (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentVideos = await db.collection("videos").countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get top creators
    const topCreators = await db
      .collection("videos")
      .aggregate([
        {
          $group: {
            _id: "$creatorInfo.fid",
            username: { $first: "$creatorInfo.username" },
            displayName: { $first: "$creatorInfo.displayName" },
            totalVideos: { $sum: 1 },
            totalViews: { $sum: "$views" },
            totalLikes: { $sum: "$likes" },
          },
        },
        { $sort: { totalViews: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    const stats = {
      totalVideos,
      totalUsers,
      totalViews: totalViews[0]?.total || 0,
      totalLikes: totalLikes[0]?.total || 0,
      recentVideos,
      topCreators,
    };

    return NextResponse.json({ stats });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
