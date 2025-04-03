"use client";
import { useState, useEffect, useRef } from "react";

export default function ClothingList({ selectedCategory, cursor }) {
  const [clothingItems, setClothingItems] = useState([]);
  const containerRef = useRef(null);
  const prevY = useRef(null);

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

  const filteredItems = clothingItems.filter(
    (item) => item.category === selectedCategory
  );

  // When dragging is active, update scrollTop based on vertical movement.
  useEffect(() => {
    if (containerRef.current && cursor && cursor.dragging) {
      const rect = containerRef.current.getBoundingClientRect();
      // Only scroll if the cursor is over the container.
      if (
        cursor.x >= rect.left &&
        cursor.x <= rect.right &&
        cursor.y >= rect.top &&
        cursor.y <= rect.bottom
      ) {
        if (prevY.current !== null) {
          const dy = cursor.y - prevY.current;
          // Adjust scrollTop based on movement (invert dy if needed)
          containerRef.current.scrollTop += -dy;
        }
      }
      prevY.current = cursor.y;
    } else {
      // Reset previous Y when not dragging.
      prevY.current = null;
    }
  }, [cursor]);

  return (
    <div ref={containerRef} className="p-6 h-full overflow-y-auto">
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
              className="w-full p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-white"
            >
              <div className="flex flex-col items-center">
                <h3 className="w-full text-center">{item.clothingID}</h3>
                <p className="w-full text-center">{item.gender}</p>
                <img
                  src={item.image2D}
                  alt={item.clothingID}
                  className="w-full h-auto rounded"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
