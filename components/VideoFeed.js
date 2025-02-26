"use client";
import { useRef, useEffect, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// Manually define HAND_CONNECTIONS for drawing the hand skeleton
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export default function VideoFeed({ onCursorUpdate, onSimulatedClick }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const globalCursorRef = useRef(null);
  const [handLandmarker, setHandLandmarker] = useState(null);
  const [webcamOn, setWebcamOn] = useState(false);
  const PINCH_DISTANCE_THRESHOLD = 0.05; // normalized units
  const CLICK_DEBOUNCE = 1000; // milliseconds
  let lastClickTime = 0;

  // --- Model Initialization ---
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
        console.log("HandLandmarker loaded in VideoFeed.");
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
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
          };
          console.log("Webcam stream acquired in VideoFeed.");
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

  // --- Set Default Global Cursor ---
  useEffect(() => {
    if (globalCursorRef.current) {
      globalCursorRef.current.style.left = `${window.innerWidth / 2}px`;
      globalCursorRef.current.style.top = `${window.innerHeight / 2}px`;
      globalCursorRef.current.style.backgroundColor = "red";
      globalCursorRef.current.style.width = "20px";
      globalCursorRef.current.style.height = "20px";
      globalCursorRef.current.style.position = "fixed";
      globalCursorRef.current.style.zIndex = "9999";
      globalCursorRef.current.style.border = "2px solid yellow";
      globalCursorRef.current.style.borderRadius = "50%";
      globalCursorRef.current.style.transform = "translate(-50%, -50%)";
      console.log("Global cursor initialized at center.");
    }
  }, []);

  // --- Process Video Frames, Update Cursor, and Simulate Click on Pinch ---
  useEffect(() => {
    async function processFrame() {
      const video = videoRef.current;
      if (!video) {
        requestAnimationFrame(processFrame);
        return;
      }
      const { videoWidth, videoHeight, currentTime } = video;
      if (videoWidth === 0 || videoHeight === 0) {
        requestAnimationFrame(processFrame);
        return;
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      if (processFrame.lastTime !== currentTime) {
        processFrame.lastTime = currentTime;
        const startTimeMs = performance.now();
        try {
          const results = await handLandmarker.detectForVideo(video, startTimeMs);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (results.landmarks && results.landmarks.length > 0) {
            results.landmarks.forEach((landmarks) => {
              // Draw hand landmarks using global functions attached via CDN
              if (window.drawConnectors && window.drawLandmarks) {
                window.drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 2 });
                window.drawLandmarks(ctx, landmarks, { color: "#FF0000", lineWidth: 1 });
              } else {
                console.warn("Drawing utilities not available on window.");
              }
              // Update global cursor based on index fingertip (landmark 8)
              const indexTip = landmarks[8];
              const globalX = indexTip.x * window.innerWidth;
              const globalY = indexTip.y * window.innerHeight;
              if (globalCursorRef.current) {
                globalCursorRef.current.style.left = `${globalX}px`;
                globalCursorRef.current.style.top = `${globalY}px`;
              }
              // Call onCursorUpdate callback
              if (onCursorUpdate) onCursorUpdate({ x: globalX, y: globalY });
              // Pinch gesture detection for simulated click
              const thumbTip = landmarks[4];
              const dx = thumbTip.x - indexTip.x;
              const dy = thumbTip.y - indexTip.y;
              const pinchDistance = Math.sqrt(dx * dx + dy * dy);
              const now = Date.now();
              if (pinchDistance < PINCH_DISTANCE_THRESHOLD && now - lastClickTime > CLICK_DEBOUNCE) {
                const el = document.elementFromPoint(globalX, globalY);
                if (el && onSimulatedClick) {
                  onSimulatedClick(el);
                }
                lastClickTime = now;
                if (globalCursorRef.current) {
                  globalCursorRef.current.style.backgroundColor = "green";
                  setTimeout(() => {
                    if (globalCursorRef.current) {
                      globalCursorRef.current.style.backgroundColor = "red";
                    }
                  }, 200);
                }
              }
              console.log("Detected landmarks:", landmarks);
            });
          } else {
            // Draw message if no hand is detected
            ctx.font = "24px Arial";
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.fillText("No hand detected", 10, 30);
          }
        } catch (error) {
          console.error("Error during detection:", error);
        }
      }
      requestAnimationFrame(processFrame);
    }
    if (handLandmarker && webcamOn) {
      processFrame();
    }
  }, [handLandmarker, webcamOn, onCursorUpdate, onSimulatedClick]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width="640"
        height="480"
        className="w-[640px] h-[480px] object-cover rounded-lg shadow-2xl"
      />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
      <div
        ref={globalCursorRef}
        className="fixed w-5 h-5 bg-red-500 border-2 border-yellow-300 rounded-full pointer-events-none"
        style={{ transform: "translate(-50%, -50%)", zIndex: 9999 }}
      ></div>
    </div>
  );
}
