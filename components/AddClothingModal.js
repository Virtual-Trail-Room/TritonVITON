"use client";
import { useState } from "react";

export default function AddClothingModal({ onClose }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [predictedCategory, setPredictedCategory] = useState("");

  // Update file state when the user selects a file.
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    console.log("Selected file:", selectedFile);
    setFile(selectedFile);
  };

  // Handle the form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear any existing message
    setPredictedCategory("");

    if (!file) {
      setMessage("Please select an image file.");
      return;
    }

    setIsLoading(true);
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
      const clothingData = await clothingRes.json();
      console.log("Clothing item added:", clothingData);

      // Display the success message with the predicted category.
      setPredictedCategory(clothingData.predictedCategory);
      setMessage(`Clothing item added successfully! Category: ${clothingData.predictedCategory}`);
      
      // Optionally, clear the file state if needed.
      setFile(null);
    } catch (error) {
      console.error("Error adding clothing item:", error);
      setMessage("Error: " + error.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop; clicking it closes the modal */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black opacity-50 cursor-pointer" 
        aria-label="Close modal"
      />
      {/* Modal Content */}
      <div className="relative z-60 w-full max-w-md p-6 bg-white rounded shadow-lg dark:bg-gray-800">
        <h2 className="text-2xl font-bold mb-4">Add Clothing Item</h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 border-l-4 pl-2 border-blue-500 rounded">
          <strong>Guidelines:</strong> Please upload a clear image of a single clothing item shot on a flat, uniformly
          colored background with good lighting and minimal wrinkles.
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
              disabled={isLoading}
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-label="Loading spinner"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              ) : (
                "Add File"
              )}
            </button>
          </div>
          {message && (
            <p
              className={`text-center text-sm mt-2 ${
                message.startsWith("Clothing item added")
                  ? "text-green-500"
                  : "text-red-500"
              }`}
              role="alert"
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
