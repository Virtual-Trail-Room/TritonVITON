import connectToDatabase from '../../../lib/mongoose';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// GET handler: Fetch all clothing items from the database.
export async function GET(request) {
  try {
    const mongooseConnection = await connectToDatabase();
    // Use the default database from the connection URI or process.env.MONGODB_DB if provided.
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

// POST handler: Create a new clothing item and run InstantMesh to generate a 3D model.
export async function POST(request) {
  try {
    // Parse incoming JSON
    const body = await request.json();
    // Expecting body fields: clothingID, category, imageURL
    const mongooseConnection = await connectToDatabase();
    const db = mongooseConnection.connection.db;
    
    // Insert a new clothing document with a placeholder for asset3D.
    const newItem = {
      clothingID: body.clothingID,
      category: body.category,
      image2D: body.imageURL,  // This should be a Cloudinary URL or similar
      asset3D: '',             // Placeholder for the 3D model URL
    };
    const result = await db.collection('clothings').insertOne(newItem);
    const itemId = result.insertedId;

    // Set up file paths.
    const tempImagePath = path.join('/tmp', `${body.clothingID}.png`);
    const instantMeshScript = path.join(process.cwd(), 'instantmesh', 'run_instantmesh.py');
    const tempOutputMeshPath = path.join('/tmp', `${body.clothingID}.obj`);

    // Spawn the Python process using the virtual environment's Python executable.
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
      '--output', tempOutputMeshPath,
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

    // Move the generated mesh file from /tmp to a permanent location in public/models.
    const modelsDir = path.join(process.cwd(), 'public', 'models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
    const finalMeshPath = path.join(modelsDir, `${body.clothingID}.obj`);
    fs.renameSync(tempOutputMeshPath, finalMeshPath);

    // Construct a URL that points to the newly saved model.
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
