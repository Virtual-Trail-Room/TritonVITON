"use client";
import { useState, useEffect, useRef } from "react";

export default function ClothingList({ selectedCategory, cursor }) {
  const [clothingItems, setClothingItems] = useState([]);
  const containerRef = useRef(null);
  const prevY = useRef(null);

  // Fetch clothing items from the API on component mount.
  useEffect(() => {
    async function fetchClothing() {
      try {
        const res = await fetch("/api/clothing");
        const data = await res.json();
        //console.log("Fetched data:", data);
        // Ensure that the API returned an array.
        if (!Array.isArray(data)) {
          console.error("Fetched data is not an array:", data);
          setClothingItems([]);
        } else {
          setClothingItems(data);
        }
      } catch (error) {
        console.error("Error fetching clothing items:", error);
      }
    }
    fetchClothing();
  }, []);

  // Filter the clothing items by the selected category.
  const filteredItems = clothingItems.filter(
    (item) => item.category === selectedCategory
  );

  // If a 'cursor' with dragging properties is passed, update scrolling.
  useEffect(() => {
    if (containerRef.current && cursor && cursor.dragging) {
      const rect = containerRef.current.getBoundingClientRect();
      // Update scrolling only when the cursor is within the container.
      if (
        cursor.x >= rect.left &&
        cursor.x <= rect.right &&
        cursor.y >= rect.top &&
        cursor.y <= rect.bottom
      ) {
        if (prevY.current !== null) {
          const dy = cursor.y - prevY.current;
          // Invert the movement if needed.
          containerRef.current.scrollTop += -dy;
        }
      }
      prevY.current = cursor.y;
    } else {
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
                {/* Only display the clothing image */}
                <img
                  src={item.image2D}
                  alt="Clothing Item"
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
