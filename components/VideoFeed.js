"use client";

import { useRef, useEffect, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// Hand landmark connections
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
];

const CLICK_THRESHOLD = 0.05;
const FIST_THRESHOLD  = 0.1;
const CLICK_DEBOUNCE  = 1000; // ms

export default function VideoFeed({
  onCursorUpdate,
  onSimulatedClick,
  enableYolo = true,
}) {
  const videoRef      = useRef(null);
  const canvasHandRef = useRef(null);
  const cursorRef     = useRef(null);

  const lastClickTime = useRef(0);
  const running       = useRef(false);
  const rafId         = useRef(null);

  const [handLandmarker, setHandLandmarker] = useState(null);
  const [webcamOn, setWebcamOn]             = useState(false);

  // 1) Load the Mediapipe model
  useEffect(() => {
    FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    )
      .then(resolver =>
        HandLandmarker.createFromOptions(resolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        })
      )
      .then(setHandLandmarker)
      .catch(console.error);
  }, []);

  // 2) Turn on webcam once
  useEffect(() => {
    if (webcamOn) return;
    setWebcamOn(true);
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        const v = videoRef.current;
        v.srcObject = stream;
        v.play();
      })
      .catch(console.error);
  }, [webcamOn]);

  // 3) Style the custom cursor
  useEffect(() => {
    const c = cursorRef.current;
    if (!c) return;
    Object.assign(c.style, {
      display:         "block",
      width:           "40px",
      height:          "40px",
      backgroundImage: "url('/cursor-hover.png')",
      backgroundSize:  "cover",
      backgroundRepeat:"no-repeat",
      position:        "fixed",
      pointerEvents:   "none",
      transform:       "translate(-50%, -50%)",
      zIndex:          "30",
    });
  }, []);

  // 4) Resize the hand‑canvas once the video dimensions are known
  useEffect(() => {
    const v = videoRef.current;
    const c = canvasHandRef.current;
    if (!v || !c) return;
    v.onloadedmetadata = () => {
      c.width  = v.videoWidth;
      c.height = v.videoHeight;
    };
  }, []);

  // 5) Main detection + draw loop
  useEffect(() => {
    const video  = videoRef.current;
    const canvas = canvasHandRef.current;
    if (!video || !canvas) return;
    const ctx   = canvas.getContext("2d");
    const off   = document.createElement("canvas");
    const SCALE = 0.5;

    async function frame() {
      if (!handLandmarker || video.videoWidth === 0) {
        rafId.current = requestAnimationFrame(frame);
        return;
      }
      if (running.current) {
        rafId.current = requestAnimationFrame(frame);
        return;
      }
      running.current = true;

      // clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // draw downscaled video into offscreen
      off.width  = canvas.width * SCALE;
      off.height = canvas.height * SCALE;
      const offCtx = off.getContext("2d");
      offCtx.drawImage(video, 0, 0, off.width, off.height);

      try {
        const result = await handLandmarker.detectForVideo(
          off,
          performance.now()
        );
        if (result.landmarks?.length) {
          console.log("hands detected:", result.landmarks.length);
          const raw = result.landmarks[0];
          // map to main‑canvas coords
          const pts = raw.map(pt => ({
            x: pt.x / SCALE,
            y: pt.y / SCALE
          }));
          // draw skeleton
          ctx.strokeStyle = "#00FF00";
          ctx.lineWidth   = 2;
          for (let [i,j] of HAND_CONNECTIONS) {
            const p1 = pts[i], p2 = pts[j];
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
          // draw keypoints
          ctx.fillStyle = "#FF0000";
          pts.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
            ctx.fill();
          });

          // gestures
          const [t,i,m] = [4,8,12].map(k => raw[k]);
          const dTI = Math.hypot(t.x-i.x, t.y-i.y);
          const dTM = Math.hypot(t.x-m.x, t.y-m.y);
          const dIM = Math.hypot(i.x-m.x, i.y-m.y);
          const click = dTI<CLICK_THRESHOLD &&
                        dTM<CLICK_THRESHOLD &&
                        dIM<CLICK_THRESHOLD;
          let sum=0;
          for (let k of [4,8,12,16,20]) {
            const dx = raw[k].x - raw[0].x;
            const dy = raw[k].y - raw[0].y;
            sum += Math.hypot(dx, dy);
          }
          const dragging = sum/5 < FIST_THRESHOLD;

          // update cursor
          const cx = raw[0].x * window.innerWidth;
          const cy = raw[0].y * window.innerHeight;
          cursorRef.current.style.left = `${cx}px`;
          cursorRef.current.style.top  = `${cy}px`;
          onCursorUpdate?.({ x:cx, y:cy, click, dragging });

          if (click && Date.now()-lastClickTime.current>CLICK_DEBOUNCE) {
            cursorRef.current.style.backgroundImage = "url('/cursor-click.png')";
            onSimulatedClick?.(document.elementFromPoint(cx,cy));
            lastClickTime.current = Date.now();
            setTimeout(() => {
              cursorRef.current.style.backgroundImage = "url('/cursor-hover.png')";
            }, 200);
          }
        }
      } catch(err) {
        console.error("handLandmarker error:", err);
      }

      running.current = false;
      rafId.current   = requestAnimationFrame(frame);
    }

    if (webcamOn) rafId.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId.current);
  }, [handLandmarker, webcamOn]);

  return (
    <div className="absolute inset-0">
      {/* 1️⃣ Single video */}
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      {/* 2️⃣ Hand overlay */}
      <canvas
        ref={canvasHandRef}
        className="absolute inset-0 pointer-events-none z-10"
      />
      {/* 3️⃣ Custom cursor */}
      <div ref={cursorRef} />
    </div>
  );
}
