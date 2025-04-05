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

    if (!file) {
      setMessage("Please select an image file.");
      return;
    }
    if (!formData.clothingID || !formData.gender || !formData.category || !formData.asset3D) {
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
        throw new Error("Adding clothing item failed: " + errData.message);
      }
      const clothingData = await clothingRes.json();
      console.log("Clothing item added:", clothingData);
      setMessage("Clothing item added successfully!");

      // Optionally, clear the form:
      setFormData({
        clothingID: "",
        gender: "",
        category: "",
        asset3D: ""
      });
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
<<<<<<< HEAD
          placeholder="Gender (male, female, nonbinary, all gender)"
=======
          placeholder="Gender (male, female, nonbinary)"
>>>>>>> b8a709c (Addition of YOLO, improved front-end, working mongo backend, cloudinary implementation, early rough implementation of adding new images, working clicking (part 1))
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
          placeholder="3D Asset URL (if available)"
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
