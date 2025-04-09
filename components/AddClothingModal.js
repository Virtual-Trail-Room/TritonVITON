// components/AddClothingModal.js
"use client";
import { useState } from "react";

// Fixed arrays for gender and category options.
const genderOptions = ["male", "female", "nonbinary", "all gender"];
const defaultCategoryOptions = [
  "Blouses",
  "Cardigans",
  "Jackets",
  "Sweaters",
  "Tanks",
  "Tees",
  "Tops",
  "Jeans",
  "Shorts",
  "Skirts",
  "Dress"
];

export default function AddClothingModal({ onClose }) {
  const [formData, setFormData] = useState({
    clothingID: "",
    gender: genderOptions[0],
    category: defaultCategoryOptions[0]
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    console.log("Selected file:", selectedFile);
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // Reset message on new submit

    if (!file) {
      setMessage("Please select an image file.");
      return;
    }
    if (!formData.clothingID || !formData.gender || !formData.category) {
      setMessage("Please fill in all required fields.");
      return;
    }
    setIsLoading(true);
    try {
      // 1. Upload file to Cloudinary via your /api/upload endpoint.
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
      console.log("Upload result:", uploadResult);
      const imageURL = uploadResult.url;
      if (!imageURL) {
        throw new Error("No URL returned from file upload");
      }

      // 2. Combine Cloudinary URL with form data.
      const clothingPayload = {
        ...formData,
        imageURL, // This field will be used by your API to save the 2D image URL.
      };
      console.log("Clothing payload:", clothingPayload);

      // 3. Send POST request to add the clothing item.
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
      setMessage("Clothing item added successfully!");

      // Optionally, clear form fields.
      setFormData({
        clothingID: "",
        gender: genderOptions[0],
        category: defaultCategoryOptions[0],
      });
      setFile(null);

      // Auto-close the modal after a delay.
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error:", err);
      setMessage("Error adding clothing item: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      {/* Modal Content */}
      <div className="relative z-60 w-full max-w-md p-6 bg-gray-800 rounded shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-white">Add Clothing Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="clothingID"
            placeholder="Insert Clothing Name"
            value={formData.clothingID}
            onChange={handleChange}
            className="w-full p-3 rounded border border-gray-700 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Clothing ID"
          />
          <div>
            <label htmlFor="gender" className="block text-lg text-white mb-1">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-3 rounded border border-gray-700 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              aria-label="Select Gender"
            >
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className="block text-lg text-white mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-3 rounded border border-gray-700 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              aria-label="Select Category"
            >
              {defaultCategoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="file" className="block text-lg text-white mb-1">
              Upload Image
            </label>
            <input
              type="file"
              id="file"
              name="file"
              onChange={handleFileChange}
              className="w-full text-white"
              aria-label="Upload Clothing Image"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
              aria-label="Cancel"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition"
              aria-label="Submit Clothing Item"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-6 h-6 border-4 border-white border-dotted rounded-full animate-spin"></div>
                  <span>Processing</span>
                </div>
              ) : (
                "Submit"
              )}
            </button>
          </div>
          {message && (
            <p className="text-center text-sm text-red-400 mt-2" role="alert">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
