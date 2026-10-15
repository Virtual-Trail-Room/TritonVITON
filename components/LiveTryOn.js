// components/LiveTryOn.js
import { useEffect, useRef } from "react";

export default function LiveTryOn({ videoRef, onFrameOut }) {
  const wsRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    wsRef.current = new WebSocket("ws://localhost:8765/ws");

    wsRef.current.binaryType = "arraybuffer";
    wsRef.current.onmessage  = e => {
      const blob = new Blob([e.data], { type: "image/jpeg" });
      const url  = URL.createObjectURL(blob);
      onFrameOut(url);                          // parent shows on canvas
      URL.revokeObjectURL(url);                 // clean old refs
    };

    let id;
    function pump() {
      if (wsRef.current.readyState === 1 && v.readyState === 4) {
        const canvas = document.createElement("canvas");
        canvas.width  = v.videoWidth;
        canvas.height = v.videoHeight;
        canvas.getContext("2d").drawImage(v, 0, 0);
        canvas.toBlob(b => {
          if (b) wsRef.current.send(b);
        }, "image/jpeg", 0.8);
      }
      id = requestAnimationFrame(pump);
    }
    id = requestAnimationFrame(pump);
    return () => cancelAnimationFrame(id);
  }, [videoRef, onFrameOut]);

  return null; // no UI; just pumps frames
}
