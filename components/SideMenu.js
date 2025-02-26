"use client";
export default function SideMenu({ selectedCategory, onCategorySelect }) {
  const categories = ["Tops", "Jackets", "Pants", "Shoes", "Accessories"];
  return (
    <div className="p-6 bg-white border-r border-gray-200 h-full">
      <h2 className="text-2xl font-bold mb-6">Categories</h2>
      <ul className="space-y-4">
        {categories.map((cat) => (
          <li
            key={cat}
            onClick={() => onCategorySelect(cat)}
            className={`cursor-pointer p-3 rounded transition-colors ${
              selectedCategory === cat
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-blue-100"
            }`}
          >
            {cat}
          </li>
        ))}
      </ul>
    </div>
  );
}
