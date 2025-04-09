from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from ultralytics import YOLO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary GET endpoint to test server availability
@app.get("/test")
async def test_endpoint():
    return {"message": "Server is running."}

# Load YOLO Pose Model. Here, we're using "yolo11s-pose.pt"; change if desired.
try:
    model = YOLO("yolo11s-pose.pt")
    print("YOLO Pose Model loaded successfully.")
except Exception as e:
    print("Error loading YOLO Pose Model:", e)
    model = None

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Failed to decode the image. Frame is None.")
    except Exception as e:
        print("Error decoding image:", e)
        return {"error": "Error decoding image", "detail": str(e)}

    try:
        # Run YOLO Pose Estimation
        results = model.track(frame, verbose=False)
        keypoints = []
        if results:
            for result in results:
                kp = result.keypoints.xy.cpu().numpy().tolist()  # Extract keypoints
                keypoints.append(kp)
        print("Pose estimation completed. Keypoints:", keypoints)
        return {"keypoints": keypoints}
    except Exception as e:
        print("Error during YOLO pose estimation:", e)
        return {"error": "Error during pose estimation", "detail": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
