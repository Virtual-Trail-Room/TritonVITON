// components/HeaderBar.js
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DarkModeToggle from "./DarkModeToggle";
import { useHandedness } from "../contexts/HandednessContext";
import { useState } from "react";
import AddClothingModal from "./AddClothingModal";

export default function HeaderBar() {
  const pathname = usePathname();
  // Get the handedness state from context
  const { isLeftHanded, toggleHandedness } = useHandedness();
  // Local state for showing the modal to add a clothing item
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Determine if we are on the /info page.
  const isInfoPage = pathname === "/info";

  const toggleModal = () => setIsModalOpen((prev) => !prev);

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white shadow-md dark:bg-gray-800">
      {/* Title: If on the info page, the title is a clickable Link to home */}
      {isInfoPage ? (
        <Link
          href="/"
          className="text-2xl font-bold text-gray-900 dark:text-white"
          aria-label="Go to Home"
        >
          TritonVITON
        </Link>
      ) : (
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          TritonVITON
        </h1>
      )}
      {/* Controls */}
      <div className="flex items-center gap-4">
        <DarkModeToggle />
        {/* Only show these buttons if not on the info page */}
        {!isInfoPage && (
          <>
            <button
              onClick={toggleHandedness}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition"
              aria-label="Toggle left-handed/right-handed layout"
            >
              {isLeftHanded ? "Right-Handed Users" : "Left-Handed Users"}
            </button>
            <Link
              href="/info"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
              aria-label="Project Information"
            >
              i
            </Link>
            <button
              onClick={toggleModal}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              aria-label="Add new clothing item"
            >
              Add Item
            </button>
          </>
        )}
      </div>
      {/* Render the AddClothingModal if open */}
      {isModalOpen && <AddClothingModal onClose={toggleModal} />}
    </header>
  );
}
