// app/api/categories/route.js
import connectToDatabase from "../../../lib/mongoose";
import Category from "../../../models/category.model";

export async function GET(request) {
  try {
    await connectToDatabase();
    const categories = await Category.find({});
    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return new Response(JSON.stringify({ message: "Failed to fetch categories", error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const newCategory = new Category(body);
    await newCategory.save();
    return new Response(JSON.stringify(newCategory), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to save category:", error);
    return new Response(JSON.stringify({ message: "Failed to save category", error: error.message }), { status: 500 });
  }
}
