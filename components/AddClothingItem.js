"use client";
import { useState } from "react";

export default function AddClothingItem() {
  const [formData, setFormData] = useState({
    clothingID: "",
    gender: "",
    category: "",
    asset3D: ""
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
    setMessage("");

    // Ensure a file is selected and all fields are filled
    if (!file) {
      setMessage("Please select an image file.");
      return;
    }
    if (!formData.clothingID || !formData.gender || !formData.category || !formData.asset3D) {
      setMessage("Please fill in all required fields.");
      return;
    }

    try {
      // 1. Upload the image file to Cloudinary via our API route.
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

      // 2. Combine the image URL with the rest of the form data
      const clothingPayload = {
        ...formData,
        image2D: imageURL,
      };
      console.log("Clothing payload:", clothingPayload);

      // 3. Send the final POST request to add the clothing item
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

      // Clear the form (optional)
      setFormData({ clothingID: "", gender: "", category: "", asset3D: "" });
      setFile(null);
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error adding clothing item: " + error.message);
    }
  };

  return (
    <div>
      <h2>Add a Clothing Item</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="clothingID"
          placeholder="Clothing ID"
          value={formData.clothingID}
          onChange={handleChange}
        />
        <input
          type="text"
          name="gender"
          placeholder="Gender (male, female, nonbinary, all gender)"
          value={formData.gender}
          onChange={handleChange}
        />
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
        />
        <input
          type="text"
          name="asset3D"
          placeholder="3D Asset URL"
          value={formData.asset3D}
          onChange={handleChange}
        />
        <input
          type="file"
          name="file"
          onChange={handleFileChange}
        />
        <button type="submit">Add</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
