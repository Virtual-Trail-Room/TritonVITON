import connectToDatabase from "../../../lib/mongoose";
import Clothing from "../../../models/clothing.model";

export async function GET(request) {
  try {
    await connectToDatabase();
    const clothingItems = await Clothing.find({});
    return new Response(JSON.stringify(clothingItems), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch clothing items:", error);
    return new Response(
      JSON.stringify({ message: "Failed to fetch clothing items" }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    console.log("Received POST body:", body);
    const newItem = new Clothing(body);
    await newItem.save();
    return new Response(JSON.stringify(newItem), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Failed to save clothing item:", error);
    // Include the stack trace for more details
    return new Response(
      JSON.stringify({
        message: "Failed to save clothing item",
        error: error.message,
        stack: error.stack,
      }),
      { status: 500 }
    );
  }
}



