// app/api/clothing/route.js
import connectToDatabase from '../../../lib/mongoose';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request) {
  try {
    // Parse incoming JSON
    const body = await request.json();
    // Expecting body fields: clothingID, gender, category, imageURL
    const mongooseConnection = await connectToDatabase();
    const db = mongooseConnection.connection.useDb(process.env.MONGODB_DB || 'clothing');
    
    // Insert a new clothing document with a placeholder for asset3D.
    const newItem = {
      clothingID: body.clothingID,
      gender: body.gender,
      category: body.category,
      image2D: body.imageURL,  // This should already be the Cloudinary URL
      asset3D: '',             // placeholder for the 3D model URL
    };
    const result = await db.collection('clothings').insertOne(newItem);
    const itemId = result.insertedId;

    // Set up file paths.
    // For example, we assume the image file is already local or downloaded.
    const tempImagePath = path.join('/tmp', `${body.clothingID}.png`);
    const instantMeshScript = path.join(process.cwd(), 'instantmesh', 'run_instantmesh.py');
    const tempOutputMeshPath = path.join('/tmp', `${body.clothingID}.obj`);

    // Spawn the Python process (using your virtual environment's Python)
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

    // Move the generated mesh file from the temporary folder to a permanent location.
    // We'll store it in the "public/models" directory.
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
