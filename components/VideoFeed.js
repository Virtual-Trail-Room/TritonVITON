"use client";
import { useRef, useEffect, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// --- Mediapipe HandLandmarker Configurations ---
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

// --- YOLO Pose Skeleton Connections ---
const SKELETON_CONNECTIONS = [
  [1, 2], [1, 3], [2, 4], [3, 5],
  [6, 7], [6, 8], [7, 9], [8, 10], [9, 11],
  [12, 13], [12, 14], [13, 15], [14, 16], [15, 17],
  [6, 12], [7, 13],
];

export default function VideoFeed({ onCursorUpdate, onSimulatedClick }) {
  const videoRef = useRef(null);
  const canvasHandRef = useRef(null);
  const canvasYoloRef = useRef(null);
  const globalCursorRef = useRef(null);
  const lastCursorPosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const yoloKeypointsRef = useRef(null);

  const [handLandmarker, setHandLandmarker] = useState(null);
  const [webcamOn, setWebcamOn] = useState(false);

  const PINCH_DISTANCE_THRESHOLD = 0.05; // normalized units
  const CLICK_DEBOUNCE = 1000; // ms between simulated clicks
  const lastClickTimeRef = useRef(0);

  // --- Initialize HandLandmarker ---
  useEffect(() => {
    if (!videoRef.current) return;
    async function createLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const model = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
        console.log("HandLandmarker loaded.");
        setHandLandmarker(model);
      } catch (error) {
        console.error("Error creating HandLandmarker:", error);
      }
    }
    createLandmarker();
  }, []);

  // --- Enable Webcam ---
  useEffect(() => {
    async function enableWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => videoRef.current.play();
          console.log("Webcam stream acquired.");
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    }
    if (!webcamOn) {
      setWebcamOn(true);
      enableWebcam();
    }
  }, [webcamOn]);

  // --- Initialize Global Cursor Styling ---
  useEffect(() => {
    if (globalCursorRef.current) {
      Object.assign(globalCursorRef.current.style, {
        left: `${lastCursorPosRef.current.x}px`,
        top: `${lastCursorPosRef.current.y}px`,
        backgroundColor: "red",
        width: "20px",
        height: "20px",
        position: "fixed",
        zIndex: "30",
        border: "2px solid yellow",
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
      });
      console.log("Global cursor initialized at center.");
    }
  }, []);

  // --- Hand Detection Loop (drawn on canvasHandRef) ---
  useEffect(() => {
    async function processHandFrame() {
      const video = videoRef.current;
      if (!video) {
        requestAnimationFrame(processHandFrame);
        return;
      }
      const { videoWidth, videoHeight } = video;
      if (videoWidth === 0 || videoHeight === 0) {
        requestAnimationFrame(processHandFrame);
        return;
      }
      const canvas = canvasHandRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const startTimeMs = performance.now();

      if (handLandmarker) {
        try {
          const handResults = await handLandmarker.detectForVideo(video, startTimeMs);
          if (handResults.landmarks && handResults.landmarks.length > 0) {
            handResults.landmarks.forEach((landmarks) => {
              if (window.drawConnectors && window.drawLandmarks) {
                window.drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 2 });
                window.drawLandmarks(ctx, landmarks, { color: "#FF0000", lineWidth: 1 });
              } else {
                console.warn("Drawing utilities not available on window.");
              }
              const indexTip = landmarks[8];
              const globalX = indexTip.x * window.innerWidth;
              const globalY = indexTip.y * window.innerHeight;
              lastCursorPosRef.current = { x: globalX, y: globalY };
              if (globalCursorRef.current) {
                globalCursorRef.current.style.left = `${globalX}px`;
                globalCursorRef.current.style.top = `${globalY}px`;
              }
              if (onCursorUpdate) onCursorUpdate({ x: globalX, y: globalY });
              const thumbTip = landmarks[4];
              const dx = thumbTip.x - indexTip.x;
              const dy = thumbTip.y - indexTip.y;
              const pinchDistance = Math.sqrt(dx * dx + dy * dy);
              const now = Date.now();
              if (pinchDistance < PINCH_DISTANCE_THRESHOLD && now - lastClickTimeRef.current > CLICK_DEBOUNCE) {
                const el = document.elementFromPoint(globalX, globalY);
                if (el && onSimulatedClick) onSimulatedClick(el);
                lastClickTimeRef.current = now;
                if (globalCursorRef.current) {
                  globalCursorRef.current.style.backgroundColor = "green";
                  setTimeout(() => {
                    if (globalCursorRef.current) globalCursorRef.current.style.backgroundColor = "red";
                  }, 200);
                }
              }
            });
          } else {
            console.log("No hand detected. Cursor remains at:", lastCursorPosRef.current);
          }
        } catch (error) {
          console.error("Error during hand detection:", error);
        }
      }
      requestAnimationFrame(processHandFrame);
    }
    if (handLandmarker && webcamOn) {
      processHandFrame();
    }
  }, [handLandmarker, webcamOn, onCursorUpdate, onSimulatedClick]);

  // --- YOLO Backend Polling (update yoloKeypointsRef) ---
  useEffect(() => {
    if (webcamOn) {
      const intervalId = setInterval(() => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = video.videoWidth;
        offscreenCanvas.height = video.videoHeight;
        const offscreenCtx = offscreenCanvas.getContext("2d");
        offscreenCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        offscreenCanvas.toBlob(async (blob) => {
          if (!blob) {
            console.error("Failed to convert frame to blob.");
            return;
          }
          const formData = new FormData();
          formData.append("file", blob, "frame.jpg");
          try {
            const res = await fetch("http://localhost:8000/predict", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            console.log("YOLO backend response:", data);
            if (data.keypoints && data.keypoints.length > 0) {
              const keypoints = Array.isArray(data.keypoints[0][0])
                ? data.keypoints[0]
                : data.keypoints;
              console.log("Parsed YOLO keypoints:", keypoints);
              yoloKeypointsRef.current = keypoints;
            } else {
              yoloKeypointsRef.current = null;
            }
          } catch (error) {
            console.error("Error sending frame to YOLO backend:", error);
          }
        }, "image/jpeg");
      }, 200);
      return () => clearInterval(intervalId);
    }
  }, [webcamOn]);

  // --- YOLO Skeleton Drawing Loop (drawn on canvasYoloRef) ---
  useEffect(() => {
    function isValidKp(kp) {
      return kp[0] !== 0 || kp[1] !== 0;
    }
    function drawYoloLoop() {
      const video = videoRef.current;
      if (video && canvasYoloRef.current) {
        const ctx = canvasYoloRef.current.getContext("2d");
        canvasYoloRef.current.width = video.videoWidth;
        canvasYoloRef.current.height = video.videoHeight;
        ctx.clearRect(0, 0, canvasYoloRef.current.width, canvasYoloRef.current.height);
        if (yoloKeypointsRef.current) {
          console.log("Drawing YOLO skeleton with keypoints:", yoloKeypointsRef.current);
          let normalized = false;
          if (yoloKeypointsRef.current.length > 0) {
            const [x, y] = yoloKeypointsRef.current[0];
            if (x <= 1 && y <= 1) normalized = true;
          }
          yoloKeypointsRef.current.forEach((kp, i) => {
            if (!isValidKp(kp)) return;
            let [x, y] = kp;
            if (normalized) {
              x *= canvasYoloRef.current.width;
              y *= canvasYoloRef.current.height;
            }
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = "#FF00FF";
            ctx.fill();
            ctx.font = "16px Arial";
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(i, x + 10, y + 10);
          });
          SKELETON_CONNECTIONS.forEach(([start, end]) => {
            const kp1 = yoloKeypointsRef.current[start - 1];
            const kp2 = yoloKeypointsRef.current[end - 1];
            if (kp1 && kp2 && isValidKp(kp1) && isValidKp(kp2)) {
              let [x1, y1] = kp1;
              let [x2, y2] = kp2;
              if (normalized) {
                x1 *= canvasYoloRef.current.width;
                y1 *= canvasYoloRef.current.height;
                x2 *= canvasYoloRef.current.width;
                y2 *= canvasYoloRef.current.height;
              }
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.strokeStyle = "#FF0000";
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          });
        }
      }
      requestAnimationFrame(drawYoloLoop);
    }
    if (webcamOn) {
      drawYoloLoop();
    }
  }, [webcamOn]);

  return (
    <div className="relative w-full h-full">
      {/* The video element now fills the container */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ position: "relative", zIndex: 0 }}
        className="w-full h-full object-cover rounded-lg shadow-2xl"
      />
      {/* Hand overlay canvas */}
      <canvas
        ref={canvasHandRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      />
      {/* YOLO overlay canvas */}
      <canvas
        ref={canvasYoloRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 20 }}
      />
      <div
        id="globalCursor"
        ref={globalCursorRef}
        className="fixed pointer-events-none"
        style={{ transform: "translate(-50%, -50%)", zIndex: 30 }}
      ></div>
    </div>
  );
}
