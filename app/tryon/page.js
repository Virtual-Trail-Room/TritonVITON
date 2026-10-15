// app/tryon/page.js
"use client";

import { useRef, useState, useEffect } from "react";
import VideoFeed     from "../../components/VideoFeed";
import OutputCanvas  from "../../components/OutputCanvas";
import AddTryOnModal from "../../components/AddTryOnModal";

export default function TryOnRoom() {
  /* refs */
  const camRef = useRef(null);
  const outRef = useRef(null);

  /* ui state */
  const [busy     , setBusy]   = useState(false);
  const [showModal, setModal]  = useState(false);

  /* poll every 1 s when a cloth has been selected */
  useEffect(() => {
    let timer;
    async function loop() {
      if (!window.__selectedClothB64) {        // user still hasn’t picked
        timer = setTimeout(loop, 1000);
        return;
      }
      if (busy) {
        timer = setTimeout(loop, 200);
        return;
      }
      const v = camRef.current;
      if (!v || !v.videoWidth) {
        timer = setTimeout(loop, 500);
        return;
      }

      setBusy(true);
      try {
        /* snap one JPEG from webcam */
        const c = document.createElement("canvas");
        c.width  = v.videoWidth;
        c.height = v.videoHeight;
        c.getContext("2d").drawImage(v, 0, 0);
        const blob  = await new Promise(r=>c.toBlob(r,"image/jpeg",.9));
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const b64   = btoa(String.fromCharCode(...bytes));

        /* send to backend */
        const r = await fetch("http://localhost:9000/infer", {
          method : "POST",
          mode : "cors",
          headers: { "Content-Type":"application/json" },
          body   : JSON.stringify({
            // mode      : "image",
            person_b64: b64,
            cloth_b64 : window.__selectedClothB64 || null
          })
        });
        if (r.ok) {
          const { result_b64 } = await r.json();
          const img  = new Image();
          img.onload = () => {
            const ctx = outRef.current.getContext("2d");
            ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
          };
          img.src = `data:image/jpeg;base64,${result_b64}`;
        } else {
          console.error(await r.text());
        }
      } catch (err) { console.error(err); }

      setBusy(false);
      timer = setTimeout(loop, 1000);
    }

    loop();
    return () => clearTimeout(timer);
  }, [busy]);

  /* ----------  render  ---------- */
  return (
    <main className="pt-16 h-screen w-screen flex bg-black">
      {/* left: live webcam */}
      <div className="flex-1 relative">
        <VideoFeed
          ref={camRef}
          onCursorUpdate={()=>{}}
          onSimulatedClick={()=>{}}
        />
      </div>

      {/* right: backend output */}
      <div className="flex-1 relative bg-gray-900">
        <OutputCanvas ref={outRef}/>
      </div>

      {/* floating “Pick cloth” button */}
      <button
        onClick={()=>setModal(true)}
        className="fixed bottom-8 right-8 z-30 px-6 py-3 rounded-full
                   bg-blue-600 text-white shadow-lg hover:bg-blue-700"
      >
        Pick&nbsp;Cloth
      </button>

      {showModal &&
        <AddTryOnModal
          videoRef={camRef}
          onClose={()=>setModal(false)}
        />}
    </main>
  );
}
