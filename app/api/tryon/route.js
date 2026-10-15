// app/api/tryon/route.js
import { NextResponse } from "next/server";
import { mkdir, writeFile, readFile, readdir } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import os   from "os";

export async function POST(req) {
  const { mode, personFile, clothFile } = await req.json();       // "image" | "video"
  if (!["image", "video"].includes(mode))
    return NextResponse.json({ error: "mode must be 'image' or 'video'" }, { status: 400 });

  /* 1 ── temp dirs */
  const tmp        = os.tmpdir();
  const inputDir   = path.join(tmp, "input");
  const imageDir   = path.join(inputDir, mode === "video" ? "video" : "image");
  const clothDir   = path.join(inputDir, "cloth");
  const outputDir  = path.join(tmp, "output", mode);

  await mkdir(imageDir, { recursive: true });
  await mkdir(clothDir, { recursive: true });
  await mkdir(outputDir,{ recursive: true });

  /* ───────────────── 2. write incoming files ─────────────────────── */
  const personName = "person";
  const clothName  = "cloth";

  if (mode === "video") {
    // 1) save WebM
    const webmPath = path.join(imageDir, `${personName}.webm`);
    await writeFile(webmPath, Buffer.from(personFile, "base64"));

    // 2) remux → MP4  (copy codecs; needs no encoders)
    const mp4Path  = path.join(imageDir, `${personName}.mp4`);
    await new Promise((res, rej) => {
      const ff = spawn("ffmpeg",
        ["-y", "-i", webmPath, "-c:v", "copy", "-c:a", "copy", mp4Path]);
      ff.stderr.on("data", d => console.error("ffmpeg:", d.toString()));
      ff.on("close", c => (c ? rej(new Error("ffmpeg failed")) : res()));
    });
  } else {                                        // still photo
    await writeFile(
      path.join(imageDir, `${personName}.jpg`),
      Buffer.from(personFile, "base64")
    );
  }

  /* 3 ── spawn python */
  const scriptDir = path.join(process.cwd(), "backend");
  const pyArgs    = [
    path.join(scriptDir, "inference.py"),
    "--mode",       mode,
    "--input_dir",  inputDir,
    "--output_dir", outputDir,
    "--person",     personName,
    "--cloth",      clothName,
  ];
  const py = spawn(process.platform === "win32" ? "python" : "python3", pyArgs, { cwd: scriptDir });

  let stderr = "";
  py.stderr.on("data", d => (stderr += d));

  const code = await new Promise(res => py.on("close", res));
  if (code !== 0)
    return NextResponse.json({ error: stderr }, { status: 500 });

  /* 4 ── grab result */
  const files  = await readdir(outputDir);
  const target = files.find(f => mode === "video" ? f.endsWith(".mp4") : f.endsWith(".jpg"));
  if (!target)
    return NextResponse.json({ error: "No output file found" }, { status: 500 });

  const buffer = await readFile(path.join(outputDir, target));
  return NextResponse.json({ data: buffer.toString("base64") });
}
