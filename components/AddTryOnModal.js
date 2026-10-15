/* components/AddTryOnModal.js */
"use client";

import { useState } from "react";

/**
 * Simple cloth-picker modal.
 *
 * – When the user hits “Use this cloth”, the chosen file is converted to
 *   Base-64 and stored in `window.__selectedClothB64`.
 * – The polling loop inside /app/tryon/page.js notices that value and
 *   begins sending webcam frames to the backend.
 */
export default function AddTryOnModal({ onClose }) {
  const [clothFile, setClothFile] = useState(null);
  const [msg     , setMsg]       = useState("");
  const [busy    , setBusy]      = useState(false);

  /** helper: File → base-64 (no data-URL prefix) */
  const file2b64 = f =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.readAsDataURL(f);
      r.onload  = () => res(r.result.split(",")[1]);
      r.onerror = rej;
    });

  async function handleSave(e) {
    e.preventDefault();
    if (!clothFile) return setMsg("Pick a cloth image first.");
    setBusy(true);
    try {
      const b64 = await file2b64(clothFile);
      window.__selectedClothB64 = b64;   // 👈 make it globally visible
      onClose();                         // dismiss modal
    } catch (err) {
      console.error(err);
      setMsg("Failed to load image.");
    }
    setBusy(false);
  }
    
  async function handleClothSelect(e) {
    const file = e.target.files[0];
    setClothFile(file);
    if (!file) return;

    // convert once and expose to the polling loop
    const b64 = await file2b64(file);
    window.__selectedClothB64 = b64;          // ← ★ this is what the loop needs
  }

  /* make sure the global key exists (prevents undefined checks) */
  if (typeof window !== "undefined" && !window.__selectedClothB64)
    window.__selectedClothB64 = null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        onClick={busy ? undefined : onClose}
        className="absolute inset-0 bg-black/60"
      />

      <div className="relative z-10 w-full max-w-sm p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Choose a cloth image</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={handleClothSelect}
            className="block w-full border p-2 rounded"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !clothFile}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {busy ? "Saving…" : "Use this cloth"}
            </button>
          </div>
        </form>

        {msg && <p className="mt-3 text-red-600">{msg}</p>}
      </div>
    </div>
  );
}


