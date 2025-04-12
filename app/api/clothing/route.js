import connectToDatabase from '../../../lib/mongoose';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid'; // Ensure this is installed: npm install uuid

// Helper function to download an image from a URL to a local destination.
async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

export async function GET(request) {
  try {
    const mongooseConnection = await connectToDatabase();
    const db = mongooseConnection.connection.db; // Use the default DB from your URI
    // Query all clothing items from the "clothings" collection.
    const clothingItems = await db.collection('clothings').find({}).toArray();
    
    // Log the result for debugging.
    console.log("Fetched clothing items:", clothingItems);

    // Return the data as JSON using NextResponse.json()
    return NextResponse.json(clothingItems);
  } catch (error) {
    console.error("Failed to fetch clothing items:", error);
    return NextResponse.json(
      { message: "Error fetching items" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Parse incoming JSON; expect fields: clothingID and imageURL.
    const body = await request.json();
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
    if (mongooseConnection.connection && mongooseConnection.connection.db) {
      db = mongooseConnection.connection.db;
    } else if (typeof mongooseConnection.db === "function") {
      db = mongooseConnection.db(process.env.MONGODB_DB || "clothings");
    } else {
      throw new Error("Invalid database connection object.");
    }

    // Insert a new clothing document.
    const newItem = {
      clothingID: body.clothingID,
      category: "",            // To be updated by classifier.
      image2D: body.imageURL,  // Cloudinary URL for the 2D image.
      asset3D: "",             // Placeholder (if you add 3D later).
    };
    const result = await db.collection("clothings").insertOne(newItem);
    const itemId = result.insertedId;

    // Determine temporary file paths using the OS temporary directory.
    const tempDir = os.tmpdir();
    const tempImagePath = path.join(tempDir, `${body.clothingID}.png`);
    // (For InstantMesh, we would also need an output mesh path.)
    const tempOutputMeshPath = path.join(tempDir, `${body.clothingID}.obj`);
    console.log("Temporary image path:", tempImagePath);

    // Download the image locally.
    await downloadImage(body.imageURL, tempImagePath);

    // ****************************
    // CLASSIFICATION STEP
    // ****************************
    // Build the module name for your classifier script.
    // (Ensure your classifier folder has an __init__.py file and that predict.py is in the classifier folder.)
    const classifierModule = "classifier.predict";
    console.log("Classifier module:", classifierModule, "\n(Ensure __init__.py exists in the classifier folder.)");

    // Use the virtual environment's Python executable.
    const pythonExecutable = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
    console.log("Using Python executable for classification:", pythonExecutable);

    // Spawn the classifier process using the '-m' flag so that Python runs your module.
    const classifierProcess = spawn(
      pythonExecutable,
      ["-m", classifierModule, tempImagePath],
      {
        env: {
          ...process.env,
          VIRTUAL_ENV: path.join(process.cwd(), ".venv"),
          PATH: `${path.join(process.cwd(), ".venv", "Scripts")};${process.env.PATH}`,
        },
      }
    );

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
      throw new Error(
        `Classifier process exited with code ${classifierExitCode}. Stderr: ${classifierStderr}`
      );
    }
    // Parse classifier output (expecting a line like: "Predicted label: Tee")
    const predictedLabelMatch = classifierStdout.match(/Predicted label:\s*(.+)/);
    if (!predictedLabelMatch) {
      throw new Error("Could not parse predicted label from classifier output.");
    }
    let predictedLabel = predictedLabelMatch[1].trim();
    console.log("Raw predicted label:", predictedLabel);

    // Map singular labels to plural if needed.
    const labelMapping = {
      "Blouse": "Blouses",
      "Cardigan": "Cardigans",
      "Jacket": "Jackets",
      "Sweater": "Sweaters",
      "Tank": "Tanks",
      "Tee": "Tees",
      "Top": "Tops",
      "Jeans": "Jeans",
      "Short": "Shorts",
      "Skirt": "Skirts",
      "Dress": "Dress"
    };
    if (labelMapping[predictedLabel]) {
      predictedLabel = labelMapping[predictedLabel];
    }
    console.log("Mapped predicted label:", predictedLabel);

    // Update the MongoDB document with the predicted category.
    await db.collection("clothings").updateOne(
      { _id: itemId },
      { $set: { category: predictedLabel } }
    );

    // Optionally, delete the temporary image file.
    fs.unlinkSync(tempImagePath);

    // ****************************
    // INSTANT MESH STEP (OPTIONAL)
    // ****************************
    // If you no longer need 3D mesh generation, comment out or remove this entire block.
    /* 
    const instantMeshScript = path.join(process.cwd(), "instantmesh", "run_instantmesh.py");
    console.log("InstantMesh script path:", instantMeshScript);
    console.log("Using Python executable for InstantMesh:", pythonExecutable);
    const instantMeshProcess = spawn(
      pythonExecutable,
      [
        instantMeshScript, // Ensure the script file is the first argument.
        "--input", tempImagePath,
        "--config", path.join(process.cwd(), "configs", "instant-mesh-large.yaml"),
        "--ckpt", path.join(process.cwd(), "ckpts", "instant_mesh_large.ckpt"),
        "--output", tempOutputMeshPath,
      ],
      {
        env: {
          ...process.env,
          VIRTUAL_ENV: path.join(process.cwd(), ".venv"),
          PATH: `${path.join(process.cwd(), ".venv", "Scripts")};${process.env.PATH}`,
        },
      }
    );
  
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
      throw new Error(
        `InstantMesh process exited with code ${instantMeshExitCode}. Stderr: ${instantMeshStderr}`
      );
    }
    console.log("Temporary output mesh path:", tempOutputMeshPath);
  
    // Move the generated mesh file to a permanent location in the "public/models" directory.
    const modelsDir = path.join(process.cwd(), "public", "models");
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
    const finalMeshPath = path.join(modelsDir, `${body.clothingID}.obj`);
    fs.renameSync(tempOutputMeshPath, finalMeshPath);
    const modelUrl = `/models/${body.clothingID}.obj`;
  
    // Update the MongoDB document with the mesh URL.
    await db.collection("clothings").updateOne(
      { _id: itemId },
      { $set: { asset3D: modelUrl } }
    );
    */
    // *********************************************************************

    return new NextResponse(
      JSON.stringify({
        message: "Clothing item processed",
        id: itemId,
        // If InstantMesh is disabled, asset3D will remain empty.
        mesh: "",  
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
