"use client";
import { useState } from "react";

export default function AddClothingModal({ onClose }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  // Update file state when the user selects a file.
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    console.log("Selected file:", selectedFile);
    setFile(selectedFile);
  };

  // Handle the form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!file) {
      setMessage("Please select an image file.");
      return;
    }

    try {
      // 1. Upload the file.
      const uploadData = new FormData();
      uploadData.append("file", file);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      if (!uploadRes.ok) {
        throw new Error("File upload failed");
      }
      const uploadResult = await uploadRes.json();
      const imageURL = uploadResult.url;
      if (!imageURL) {
        throw new Error("No URL returned from file upload");
      }

      // 2. Send a POST request to add the clothing item.
      const clothingPayload = { imageURL };
      const clothingRes = await fetch("/api/clothing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clothingPayload),
      });
      if (!clothingRes.ok) {
        const errData = await clothingRes.json();
        throw new Error("Adding clothing item failed: " + errData.message);
      }
      await clothingRes.json();
      setMessage("Clothing item added successfully!");

      // Close the modal after a delay.
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error adding clothing item:", error);
      setMessage("Error: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop; clicking it will close the modal */}
      <div onClick={onClose} className="absolute inset-0 bg-black opacity-50 cursor-pointer" />
      {/* Modal Content */}
      <div className="relative z-60 w-full max-w-md p-6 bg-white rounded shadow-lg dark:bg-gray-800">
        <h2 className="text-2xl font-bold mb-4">Add Clothing Item</h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 border-l-4 pl-2 border-blue-500 rounded">
          Guidelines: Please upload a clear image of a single clothing item shot on a flat, uniformly colored background with good lighting.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="sr-only">Upload your clothing image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 dark:text-gray-300
                         file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
                         file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Add File
            </button>
          </div>
          {message && (
            <p className="text-center text-sm text-red-500 mt-2">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}
