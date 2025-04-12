import connectToDatabase from '../../eric-Z/lib/mongoose.js';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

export async function POST(request) {
  try {
    // Parse incoming JSON (fields: clothingID, imageURL)
    const body = await request.json();
    if (!body.clothingID || !body.imageURL) {
      throw new Error("Missing clothingID or imageURL in request body");
    }

    // Connect to MongoDB and create a clothing document with placeholders.
    const mongooseConnection = await connectToDatabase();
    const db = mongooseConnection.connection.db;
    const newItem = {
      clothingID: body.clothingID,
      category: '',  // Will be set by classifier.
      image2D: body.imageURL,  // Cloudinary URL for the 2D image.
      asset3D: '',   // Placeholder for the 3D model URL.
    };
    const result = await db.collection('clothings').insertOne(newItem);
    const itemId = result.insertedId;

    // Determine temporary file paths using the system temporary directory.
    const tempDir = os.tmpdir();
    const tempImagePath = path.join(tempDir, `${body.clothingID}.png`);
    const tempOutputMeshPath = path.join(tempDir, `${body.clothingID}.obj`);

    // Download the image from Cloudinary
    await downloadImage(body.imageURL, tempImagePath);
    console.log("Temporary image path:", tempImagePath);

    // ****************************
    // CLASSIFICATION STEP
    // ****************************
    // Build the absolute path to the classifier script (inside the "classifier" folder)
    const classifierScript = path.join(process.cwd(), 'classifier', 'predict.py');
    console.log("Classifier script path:", classifierScript);

    // Use the virtual environment Python executable for classification.
    const pythonExecutable = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    console.log("Using Python executable for classification:", pythonExecutable);

    const classifierProcess = spawn(pythonExecutable, [classifierScript, tempImagePath], {
      env: {
        ...process.env,
        VIRTUAL_ENV: path.join(process.cwd(), '.venv'),
        PATH: `${path.join(process.cwd(), '.venv', 'Scripts')};${process.env.PATH}`,
      },
    });

    let classifierStdout = "";
    let classifierStderr = "";
    classifierProcess.stdout.on("data", (data) => {
      classifierStdout += data.toString();
    });
    classifierProcess.stderr.on("data", (data) => {
      classifierStderr += data.toString();
    });
    const classifierExitCode = await new Promise((resolve) => {
      classifierProcess.on("close", resolve);
    });
    if (classifierExitCode !== 0) {
      console.error("Classifier stderr:", classifierStderr);
      throw new Error(`Classifier process exited with code ${classifierExitCode}. Stderr: ${classifierStderr}`);
    }
    // Parse the classifier output to extract predicted label.
    const predictedLabelMatch = classifierStdout.match(/Predicted label:\s*(.+)/);
    if (!predictedLabelMatch) {
      throw new Error("Could not parse predicted label from classifier output.");
    }
    const predictedLabel = predictedLabelMatch[1].trim();
    console.log("Predicted label:", predictedLabel);

    // Update the document with the predicted category.
    await db.collection('clothings').updateOne(
      { _id: itemId },
      { $set: { category: predictedLabel } }
    );

    // ****************************
    // INSTANT MESH STEP
    // ****************************
    const instantMeshScript = path.join(process.cwd(), 'instantmesh', 'run_instantmesh.py');
    console.log("InstantMesh script path:", instantMeshScript);
    console.log("Using Python executable for InstantMesh:", pythonExecutable);
    const instantMeshProcess = spawn(pythonExecutable, [
      "--input", tempImagePath,
      "--config", path.join(process.cwd(), "configs", "instant-mesh-large.yaml"),
      "--ckpt", path.join(process.cwd(), "ckpts", "instant_mesh_large.ckpt"),
      "--output", tempOutputMeshPath,
    ], {
      env: {
        ...process.env,
        VIRTUAL_ENV: path.join(process.cwd(), '.venv'),
        PATH: `${path.join(process.cwd(), '.venv', 'Scripts')};${process.env.PATH}`,
      },
    });

    let instantMeshStdout = "";
    let instantMeshStderr = "";
    instantMeshProcess.stdout.on("data", (data) => {
      instantMeshStdout += data.toString();
    });
    instantMeshProcess.stderr.on("data", (data) => {
      instantMeshStderr += data.toString();
    });
    const instantMeshExitCode = await new Promise((resolve) => {
      instantMeshProcess.on("close", resolve);
    });
    if (instantMeshExitCode !== 0) {
      console.error("InstantMesh stderr:", instantMeshStderr);
      throw new Error(`InstantMesh process exited with code ${instantMeshExitCode}. Stderr: ${instantMeshStderr}`);
    }
    console.log("Temporary output mesh path:", tempOutputMeshPath);

    // Move the generated mesh file to a permanent location in public/models.
    const modelsDir = path.join(process.cwd(), "public", "models");
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
    const finalMeshPath = path.join(modelsDir, `${body.clothingID}.obj`);
    fs.renameSync(tempOutputMeshPath, finalMeshPath);
    const modelUrl = `/models/${body.clothingID}.obj`;

    // Update the document with the mesh URL.
    await db.collection("clothings").updateOne(
      { _id: itemId },
      { $set: { asset3D: modelUrl } }
    );

    return new NextResponse(
      JSON.stringify({
        message: "Clothing item processed",
        id: itemId,
        mesh: modelUrl,
        predictedCategory: predictedLabel,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing clothing item:", error);
    return new NextResponse(
      JSON.stringify({ message: "Error processing clothing item", error: error.message }),
      { status: 500 }
    );
  }
}
