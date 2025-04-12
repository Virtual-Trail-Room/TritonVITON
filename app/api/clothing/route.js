import connectToDatabase from '../../../lib/mongoose';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid'; // make sure to install uuid with: npm install uuid

// Helper function to download an image from a URL to a local destination.
async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

export async function POST(request) {
  try {
    // Parse incoming JSON; expect fields: clothingID, imageURL.
    const body = await request.json();

    // If clothingID is missing, generate one.
    if (!body.clothingID) {
      body.clothingID = uuidv4();
      console.log("No clothingID provided, generated:", body.clothingID);
    }
    if (!body.imageURL) {
      throw new Error("Missing imageURL in request body");
    }

    // Connect to the database.
    const mongooseConnection = await connectToDatabase();
    let db;
    // Adjust this part based on your connection type.
    if (mongooseConnection.connection && mongooseConnection.connection.db) {
      db = mongooseConnection.connection.db;
    } else if (typeof mongooseConnection.db === 'function') {
      db = mongooseConnection.db(process.env.MONGODB_DB || 'clothings');
    } else {
      throw new Error("Invalid database connection object.");
    }

    // Insert a new clothing document.
    const newItem = {
      clothingID: body.clothingID,
      // The category will be set after classification.
      category: "",
      image2D: body.imageURL,  // Cloudinary URL.
      asset3D: "",             // Placeholder for the 3D model URL.
    };
    const result = await db.collection('clothings').insertOne(newItem);
    const itemId = result.insertedId;

    // Determine temporary file path using the system temporary directory.
    const tempDir = os.tmpdir();
    const tempImagePath = path.join(tempDir, `${body.clothingID}.png`);
    console.log("Temporary image path:", tempImagePath);

    // Download the image locally.
    await downloadImage(body.imageURL, tempImagePath);

    // *********************
    // CLASSIFICATION STEP
    // *********************
    // Build absolute path to your classifier script (assuming it's in "classifier/predict.py").
    const classifierScript = path.join(process.cwd(), 'classifier', 'predict.py');
    console.log("Classifier script path:", classifierScript);

    // Use the virtual environment's Python executable.
    const pythonExecutable = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    console.log("Using Python executable for classification:", pythonExecutable);

    // Spawn the classifier process.
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
    // Parse classifier output (expecting a line like: "Predicted label: Tee").
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

    // Optionally, delete the temporary image file.
    fs.unlinkSync(tempImagePath);

    return new NextResponse(
      JSON.stringify({
        message: "Clothing item processed",
        id: itemId,
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
