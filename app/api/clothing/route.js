// app/api/clothing/route.js
import connectToDatabase from '../../../lib/mongoose';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function GET(request) {
  try {
    const mongooseConnection = await connectToDatabase();
    // Use the default database from your connection URI.
    const db = mongooseConnection.connection.db;
    // Fetch all items from the "clothings" collection.
    const clothingItems = await db.collection('clothings').find({}).toArray();
    return new NextResponse(JSON.stringify(clothingItems), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch clothing items:", error);
    return new NextResponse(JSON.stringify({ message: "Error fetching items" }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Parse incoming JSON – expecting: clothingID, gender, category, imageURL
    const body = await request.json();
    const mongooseConnection = await connectToDatabase();
    const db = mongooseConnection.connection.db;

    // Insert a new document with placeholder for asset3D.
    const newItem = {
      clothingID: body.clothingID,
      gender: body.gender,
      category: body.category,
      image2D: body.imageURL, // Cloudinary URL for the 2D image
      asset3D: ''           // Placeholder; will be updated after processing
    };
    const result = await db.collection('clothings').insertOne(newItem);
    const itemId = result.insertedId;

    // Use OS-specific temp directory (cross-platform; on Windows, os.tmpdir() is used)
    const tempDir = os.tmpdir();
    const tempImagePath = path.join(tempDir, `${body.clothingID}.png`);
    const tempOutputMeshPath = path.join(tempDir, `${body.clothingID}.obj`);

    // Log the file paths for debugging.
    console.log("Temporary image path:", tempImagePath);
    console.log("Temporary output mesh path:", tempOutputMeshPath);

    // NOTE:
    // Make sure that the image file exists at tempImagePath.
    // You might need to download the image from body.imageURL into this location
    // (e.g. via a separate module or API) before calling InstantMesh.
    
    // Define the InstantMesh script path.
    const instantMeshScript = path.join(process.cwd(), 'instantmesh', 'run_instantmesh.py');

    // Use the Python executable from your virtual environment.
    const pythonExecutable = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    console.log("Using Python executable:", pythonExecutable);

    const env = {
      ...process.env,
      VIRTUAL_ENV: path.join(process.cwd(), '.venv'),
      PATH: `${path.join(process.cwd(), '.venv', 'Scripts')};${process.env.PATH}`,
    };

    // Spawn the Python process.
    let stderrData = "";
    const pythonProcess = spawn(pythonExecutable, [
      instantMeshScript,
      '--input', tempImagePath,
      '--config', path.join(process.cwd(), 'configs', 'instant-mesh-large.yaml'),
      '--ckpt', path.join(process.cwd(), 'ckpts', 'instant_mesh_large.ckpt'),
      '--output', tempOutputMeshPath,
    ], { env });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`InstantMesh stdout: ${data}`);
    });
    pythonProcess.stderr.on('data', (data) => {
      stderrData += data;
      console.error(`InstantMesh stderr: ${data}`);
    });

    // Wait for the process to finish.
    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`InstantMesh process exited with code ${code}. Stderr: ${stderrData}`));
        }
      });
    });

    // Move the generated mesh to a permanent location in 'public/models'
    const modelsDir = path.join(process.cwd(), 'public', 'models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
    const finalMeshPath = path.join(modelsDir, `${body.clothingID}.obj`);
    fs.renameSync(tempOutputMeshPath, finalMeshPath);

    // Construct the URL to the saved model.
    const modelUrl = `/models/${body.clothingID}.obj`;

    // Update the MongoDB document with the generated mesh URL.
    await db.collection('clothings').updateOne(
      { _id: itemId },
      { $set: { asset3D: modelUrl } }
    );

    return new NextResponse(JSON.stringify({ message: 'Clothing item processed', id: itemId, mesh: modelUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Error processing clothing item:', error);
    return new NextResponse(JSON.stringify({ message: 'Error processing clothing item', error: error.message }), { status: 500 });
  }
}
