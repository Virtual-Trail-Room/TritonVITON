// components/ClothingList.js
"use client";
import { useState, useEffect } from "react";

export default function ClothingList() {
  const [clothingItems, setClothingItems] = useState([]);

  useEffect(() => {
    async function fetchClothing() {
      try {
        const res = await fetch("/api/clothing");
        const data = await res.json();
        setClothingItems(data);
      } catch (error) {
        console.error("Error fetching clothing items:", error);
      }
    }
    fetchClothing();
  }, []);

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Clothing Pieces</h2>
      <ul className="space-y-4">
        {clothingItems.map((item) => (
          <li
            key={item._id}
            className="p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-white"
          >
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
