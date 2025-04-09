"use client";
import { useState, useEffect, useRef } from "react";

<<<<<<< HEAD
export default function ClothingList({ selectedCategory, cursor }) {
=======
export default function ClothingList({ selectedCategory }) {
>>>>>>> b8a709c (Addition of YOLO, improved front-end, working mongo backend, cloudinary implementation, early rough implementation of adding new images, working clicking (part 1))
  const [clothingItems, setClothingItems] = useState([]);
  const containerRef = useRef(null);
  const prevY = useRef(null);

  useEffect(() => {
    async function fetchClothing() {
      try {
        const res = await fetch("/api/clothing");
        const data = await res.json();
        //console.log("Fetched data:", data); // Check here!
        setClothingItems(data);
      } catch (error) {
        console.error("Error fetching clothing items:", error);
      }
    }
    fetchClothing();
  }, []);
  

<<<<<<< HEAD
=======
  // Filter items by the selected category.
>>>>>>> b8a709c (Addition of YOLO, improved front-end, working mongo backend, cloudinary implementation, early rough implementation of adding new images, working clicking (part 1))
  const filteredItems = clothingItems.filter(
    (item) => item.category === selectedCategory
  );

<<<<<<< HEAD
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
=======
  return (
    <div className="p-6 h-full overflow-y-auto">
>>>>>>> b8a709c (Addition of YOLO, improved front-end, working mongo backend, cloudinary implementation, early rough implementation of adding new images, working clicking (part 1))
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
<<<<<<< HEAD
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
=======
              className="p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-white"
            >
              <h3>{item.clothingID}</h3>
              <p>{item.gender}</p>
              <img
                src={item.image2D}
                alt={item.clothingID}
                className="w-full h-auto rounded"
              />
>>>>>>> b8a709c (Addition of YOLO, improved front-end, working mongo backend, cloudinary implementation, early rough implementation of adding new images, working clicking (part 1))
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
