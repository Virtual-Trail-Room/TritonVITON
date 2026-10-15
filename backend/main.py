from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
import os
from cloth_wrapping.inference import main as run_inference  # adjust import as needed

app = FastAPI()

@app.post("/wrap-cloth")
async def wrap_cloth(
    person: UploadFile = File(...),
    cloth: UploadFile  = File(...)
):
    # 1) save uploads
    os.makedirs("backend/cloth_wrapping/data/input/image", exist_ok=True)
    os.makedirs("backend/cloth_wrapping/data/input/cloth", exist_ok=True)
    ppath = f"backend/cloth_wrapping/data/input/image/{person.filename}"
    cpath = f"backend/cloth_wrapping/data/input/cloth/{cloth.filename}"
    with open(ppath, "wb") as f: f.write(await person.read())
    with open(cpath, "wb") as f: f.write(await cloth.read())

    # 2) call your inference
    #    assume inference.py uses args --mode image --person <no-ext> --cloth <no-ext>
    name_p = os.path.splitext(person.filename)[0]
    name_c = os.path.splitext(cloth.filename)[0]
    run_inference(mode="image", person=name_p, cloth=name_c)

    # 3) return the output file
    out_fname = f"{name_p}_{name_c}.jpg"
    out_path  = f"backend/cloth_wrapping/data/output/{out_fname}"
    return FileResponse(out_path, media_type="image/jpeg")
