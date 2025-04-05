// app/api/clothing/route.js
import connectToDatabase from '../../../lib/mongoose';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// GET handler: Fetch all clothing items from the database.
export async function GET(request) {
  try {
    const mongooseConnection = await connectToDatabase();
    // Explicitly select the database using the provided environment variable or a default name.
    const db = mongooseConnection.connection.useDb(process.env.MONGODB_DB || 'clothing');
    // Fetch all clothing items from the "clothings" collection as an array.
    const clothingItems = await db.collection('clothings').find({}).toArray();
    console.log("Fetched clothing items from Mongo:", clothingItems);
    return new NextResponse(JSON.stringify(clothingItems), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch clothing items:", error);
    return new NextResponse(JSON.stringify({ message: "Error fetching items" }), { status: 500 });
  }
}

// POST handler: Create a new clothing item and run InstantMesh to generate a 3D model.
export async function POST(request) {
  try {
    // Parse incoming JSON (adjust if you're using FormData)
    const body = await request.json();
    // Expecting body fields: clothingID, gender, category, imageURL
    const mongooseConnection = await connectToDatabase();
    const db = mongooseConnection.connection.useDb(process.env.MONGODB_DB || 'clothing');
    
    // Insert a new clothing document with a placeholder for asset3D.
    const newItem = {
      clothingID: body.clothingID,
      gender: body.gender,
      category: body.category,
      image2D: body.imageURL,
      asset3D: '', // placeholder for 3D asset
    };
    const result = await db.collection('clothings').insertOne(newItem);
    const itemId = result.insertedId;

    // Set up file paths.
    const tempImagePath = path.join('/tmp', `${body.clothingID}.png`);
    const instantMeshScript = path.join(process.cwd(), 'instantmesh', 'run_instantmesh.py');
    const outputMeshPath = path.join('/tmp', `${body.clothingID}.obj`);

    // Use the absolute path to your virtual environment's Python executable and set up environment variables.
    const pythonExecutable = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    console.log("Using Python executable:", pythonExecutable);

    const env = {
      ...process.env,
      VIRTUAL_ENV: path.join(process.cwd(), '.venv'),
      PATH: `${path.join(process.cwd(), '.venv', 'Scripts')};${process.env.PATH}`,
    };

    const pythonProcess = spawn(pythonExecutable, [
      instantMeshScript,
      '--input', tempImagePath,
      '--config', path.join(process.cwd(), 'configs', 'instant-mesh-large.yaml'),
      '--ckpt', path.join(process.cwd(), 'ckpts', 'instant_mesh_large.ckpt'),
      '--output', outputMeshPath,
    ], { env });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`InstantMesh stdout: ${data}`);
    });
    pythonProcess.stderr.on('data', (data) => {
      console.error(`InstantMesh stderr: ${data}`);
    });

    // Wait for the Python process to finish.
    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`InstantMesh process exited with code ${code}`));
        }
      });
    });

    // Update the MongoDB document with the generated mesh path.
    await db.collection('clothings').updateOne(
      { _id: itemId },
      { $set: { asset3D: outputMeshPath } }
    );

    return new NextResponse(JSON.stringify({ message: 'Clothing item processed', id: itemId, mesh: outputMeshPath }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Error processing clothing item:', error);
    return new NextResponse(JSON.stringify({ message: 'Error processing clothing item', error: error.message }), { status: 500 });
  }
}

