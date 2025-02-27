// app/api/clothing/route.js
import clientPromise from "../../../lib/mongodb";

export async function GET(request) {
  try {
    const client = await clientPromise;
    console.log("✅ MongoDB has been connected successfully");
    
    const db = client.db("myDatabase"); // Replace with your database name
    const clothingItems = await db.collection("clothing").find({}).toArray();

    return new Response(JSON.stringify(clothingItems), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Failed to fetch clothing items:", error);
    return new Response(
      JSON.stringify({ message: "Failed to fetch clothing items" }),
      { status: 500 }
    );
  }
}
