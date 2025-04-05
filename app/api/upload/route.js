// app/api/upload/route.js
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

// Make sure your Cloudinary configuration is set in environment variables.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file'); // the uploaded file
    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }
    // Convert the file to a buffer (if needed)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload_stream({
      folder: 'clothing',
    }, (error, result) => {
      if (error) throw error;
      return result;
    });
    
    // Alternatively, use a promise-based method:
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'clothing' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });
    
    return NextResponse.json({ url: result.secure_url }, { status: 200 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ message: "Upload failed", error: error.message }, { status: 500 });
  }
}
