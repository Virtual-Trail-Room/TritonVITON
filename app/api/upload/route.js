// app/api/upload/route.js
import { NextResponse } from 'next/server';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,       
  api_secret: process.env.CLOUDINARY_API_SECRET,  
});

export async function POST(request) {
  // Parse the form data from the request
  const formData = await request.formData();
  const file = formData.get('file');
  
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Convert the Blob to a Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload the file to Cloudinary using upload_stream
  return new Promise((resolve) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder: 'clothing' },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          resolve(NextResponse.json({ error: "Upload failed" }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ url: result.secure_url }));
        }
      }
    );
    stream.end(buffer);
  });
}
