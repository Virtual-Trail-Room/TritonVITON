"use client";
import { useState, useEffect } from "react";

export default function ClothingList({ selectedCategory }) {
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

  // Filter items by the selected category.
  const filteredItems = clothingItems.filter(
    (item) => item.category === selectedCategory
  );

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">
        Clothing Pieces: {selectedCategory}
      </h2>
      {filteredItems.length === 0 ? (
        <p>No items found for {selectedCategory}</p>
      ) : (
        <ul className="space-y-4">
          {filteredItems.map((item) => (
            <li
              key={item._id}
              className="p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-white"
            >
              <h3>{item.clothingID}</h3>
              <p>{item.gender}</p>
              <img
                src={item.image2D}
                alt={item.clothingID}
                className="w-full h-auto rounded"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
