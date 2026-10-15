#!/usr/bin/env python3
"""
Run once:

$ conda activate tryon_env
$ export PYTHONPATH=$PWD
$ python -m uvicorn backend.realtime_server:app --host 0.0.0.0 --port 9000
"""
from __future__ import annotations
import base64, io
from pathlib import Path

import numpy as np
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware          # ← NEW
from pydantic import BaseModel
from PIL import Image

# ─────────────────── project imports ──────────────────────────
from backend.inference import VirtualTryon, get_opt, DEVICE   # noqa

# ─────────────────── initialise nets once ─────────────────────
ROOT = Path(__file__).resolve().parent            # …/backend
opt  = get_opt([])                                # bypass CLI parsing
opt.mode        = "image"                         # always frame-wise
opt.models_dir  = str(ROOT / "models")
opt.input_dir   = str(ROOT / "data" / "input")
opt.output_dir  = str(ROOT / "data" / "output")
opt.cloth       = "5"                             # default garment id

TryOn = VirtualTryon(opt)                         # weights ➜ GPU
TryOn.load_cloth()                                # loads 5.jpg tensor

torch.backends.cudnn.benchmark = True             # speed-up convs
autocast_ctx = (
    torch.cuda.amp.autocast(dtype=torch.float16)  # mixed-precision
    if DEVICE == "cuda" else torch.no_grad()      # noop on CPU
)
print(f"✅  VITON stacks live on {DEVICE}")

# ─────────────────── FastAPI app & CORS ───────────────────────
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],                      # add your prod domain(s) here
    allow_methods=["POST"],
    allow_headers=["*"],
    allow_credentials=True,
)

class Req(BaseModel):
    person_b64: str              # JPEG frame (always)
    cloth_b64:  str | None = None  # only on garment change

# ─────────────────── helpers ──────────────────────────────────
def _b64_to_np_rgb(b64: str) -> np.ndarray:
    """base-64 → np.uint8 H×W×3 RGB (handles missing padding)."""
    b64 += "=" * (-len(b64) % 4)
    img = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
    return np.asarray(img)

def _np_to_b64_jpeg(arr: np.ndarray) -> str:
    """np.uint8 H×W×3 → base-64 JPEG."""
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, "JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()

# ─────────────────── main route ───────────────────────────────
@app.post("/infer")
def infer(req: Req):
    global TryOn

    # — garment swap — ------------------------------------------------
    if req.cloth_b64:
        cloth_np = _b64_to_np_rgb(req.cloth_b64)
        cloth_t  = torch.from_numpy(cloth_np).permute(2, 0, 1).float() / 255
        TryOn.cloth = cloth_t.unsqueeze(0).to(DEVICE)

    # — frame processing — -------------------------------------------
    frame_np = _b64_to_np_rgb(req.person_b64)

    out_np = TryOn.wrap(frame_np)    # uint8 RGB (256×192 by default)

    return {"result_b64": _np_to_b64_jpeg(out_np)}
