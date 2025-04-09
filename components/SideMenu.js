// components/SideMenu.js
"use client";
import { useState } from "react";
import CustomDropdown from "./CustomDropdown";

// Define your category groups.
const CATEGORY_GROUPS = {
  Top: ["Blouses", "Cardigans", "Jackets", "Sweaters", "Tanks", "Tees", "Tops"],
  Bottom: ["Jeans", "Shorts", "Skirts"],
  "Full-body": ["Dress"],
};

export default function SideMenu({ selectedCategory, onCategorySelect }) {
  // We'll list all group options
  const groupOptions = Object.keys(CATEGORY_GROUPS);
  // Use one of the groups as the default or based on your app logic.
  const [selectedGroup, setSelectedGroup] = useState("Top");

  const displayedCategories = CATEGORY_GROUPS[selectedGroup];

  return (
    <div className="p-6 bg-black bg-opacity-60 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-white">Categories</h2>

      {/* Use our custom dropdown for group selection */}
      <div className="mb-6">
        <CustomDropdown
          options={groupOptions}
          selected={selectedGroup}
          onChange={(group) => setSelectedGroup(group)}
        />
      </div>

      {/* List of categories from the selected group */}
      <ul className="space-y-4">
        {displayedCategories.map((cat) => (
          <li
            key={cat}
            onClick={() => onCategorySelect(cat)}
            className={`cursor-pointer p-4 rounded transition-colors text-white text-xl ${
              selectedCategory === cat ? "bg-blue-500" : "bg-gray-800 hover:bg-blue-400"
            }`}
          >
            {cat}
          </li>
        ))}
      </ul>
    </div>
  );
}
