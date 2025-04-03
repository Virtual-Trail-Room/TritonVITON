"use client";
import { useState, useEffect } from "react";

export default function SideMenu({ selectedCategory, onCategorySelect }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        // Map to an array of names; if empty, fallback to default categories
        setCategories(
          data.length > 0
            ? data.map((cat) => cat.name)
            : ["Blouses", "Cardigans", "Jackets", "Sweaters", "Tanks", "Tees", "Tops", "Jeans", "Shorts", "Skirts", "Dress"]
        );
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories(["Blouses", "Cardigans", "Jackets", "Sweaters", "Tanks", "Tees", "Tops", "Jeans", "Shorts", "Skirts", "Dress"]);
      }
    }
    fetchCategories();
  }, []);

  return (
    <div className="p-4 bg-black bg-opacity-60 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-white">Categories</h2>
      <ul className="space-y-4">
        {categories.map((cat) => (
          <li
            key={cat}
            onClick={() => onCategorySelect(cat)}
            className={`cursor-pointer p-4 rounded transition-colors ${
              selectedCategory === cat
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-blue-400 hover:text-white"
            }`}
          >
            {cat}
          </li>
        ))}
      </ul>
    </div>
  );
}
