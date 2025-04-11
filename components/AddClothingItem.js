"use client";
import { useState } from "react";

export default function AddClothingItem() {
  const [formData, setFormData] = useState({
    clothingID: "",
    // Use a dropdown for gender with a default value.
    category: "",
    // We'll ignore imageURL here because it comes from Cloudinary later.
    imageURL: "",
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

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
    if (!formData.clothingID || !formData.category) {
      setMessage("Please fill in all required fields.");
      return;
    }

    try {
      // 1. Upload file to Cloudinary
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

      // 2. Combine Cloudinary URL with form data
      const clothingPayload = {
        ...formData,
        imageURL, // Using the returned Cloudinary URL
      };
      console.log("Clothing payload:", clothingPayload);

      // 3. Send final POST request to add the clothing item
      const clothingRes = await fetch("/api/clothing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clothingPayload),
      });
      if (!clothingRes.ok) {
        const errData = await clothingRes.json();
        throw new Error("Adding clothing item failed: " + (errData.message || "Submission error"));
      }
      const clothingData = await clothingRes.json();
      console.log("Clothing item added:", clothingData);
      setMessage("Clothing item added successfully!");

      // Optionally, clear the form:
      setFormData({
        clothingID: "",
        category: "",
        imageURL: "",
      });
      setFile(null);
    } catch (err) {
      console.error("Error:", err);
      setMessage("Error adding clothing item: " + err.message);
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded-md">
      <h2 className="text-2xl font-bold mb-4">Add a Clothing Item</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="clothingID"
          placeholder="Clothing ID"
          value={formData.clothingID}
          onChange={handleChange}
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">Select Category</option>
          <option value="Blouses">Blouses</option>
          <option value="Cardigans">Cardigans</option>
          <option value="Jackets">Jackets</option>
          <option value="Sweaters">Sweaters</option>
          <option value="Tanks">Tanks</option>
          <option value="Tees">Tees</option>
          <option value="Tops">Tops</option>
          <option value="Jeans">Jeans</option>
          <option value="Shorts">Shorts</option>
          <option value="Skirts">Skirts</option>
          <option value="Dress">Dress</option>
        </select>
        <input
          type="file"
          name="file"
          onChange={handleFileChange}
          className="w-full"
        />
        <button
          type="submit"
          className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Add Clothing Item
        </button>
      </form>
      {message && <p className="mt-2 text-center text-sm">{message}</p>}
    </div>
  );
}
