"use client";
export default function ClothingList() {
  return (
    <div className="flex-1 overflow-y-auto border p-4 rounded">
      {Array.from({ length: 25 }, (_, i) => (
        <button
          key={i}
          className="w-full p-3 mb-4 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          Item {i + 1}
        </button>
      ))}
    </div>
  );
}
