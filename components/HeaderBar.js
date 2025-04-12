"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DarkModeToggle from "./DarkModeToggle";
import { useHandedness } from "../contexts/HandednessContext";
import { useState } from "react";
import AddClothingModal from "./AddClothingModal";

export default function HeaderBar() {
  const pathname = usePathname();
  // Get handedness state and toggle function from context.
  const { isLeftHanded, toggleHandedness } = useHandedness();
  // Local state for showing the modal to add a clothing item.
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Determine if we are on the info page.
  const isInfoPage = pathname === "/info";
    
  // Toggle the Add Clothing modal.
  const toggleModal = () => setIsModalOpen((prev) => !prev);

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white shadow-md dark:bg-gray-800">
      {/* Title: on the info page, the title is clickable */}
      {isInfoPage ? (
        <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
          TritonVITON
        </Link>
      ) : (
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TritonVITON</h1>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        <DarkModeToggle />
        {/* These additional buttons appear only when not on the info page */}
        {!isInfoPage && (
          <>
            <button
              onClick={toggleHandedness}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition"
              aria-label="Toggle handedness"
            >
              {isLeftHanded ? "Right-handed Users" : "Left-handed Users"}
            </button>

            {/* Information Button */}
            <Link href="/info" aria-label="Project Information">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition">
                i
              </span>
            </Link>
            {/* Add Clothing Item Button */}
            <button
              onClick={toggleModal}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              aria-label="Add new clothing item"
            >
              Add Item
            </button>

            {/* Code Button (GitHub link) */}
            <a
              href="https://github.com/Virtual-Trail-Room/TritonVITON" // Replace with your actual repo URL.
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Code on GitHub"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition"
            >
              {/* GitHub SVG Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-6 h-6" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.075.55-.175.55-.388 0-.19-.007-.693-.01-1.36-2.226.483-2.695-1.073-2.695-1.073-.364-.924-.89-1.17-.89-1.17-.727-.497.055-.487.055-.487.804.057 1.227.826 1.227.826.716 1.225 1.876.872 2.335.667.073-.518.28-.872.508-1.073-1.777-.202-3.644-.888-3.644-3.95 0-.872.311-1.586.823-2.145-.083-.202-.357-1.016.078-2.12 0 0 .67-.214 2.2.82a7.65 7.65 0 0 1 2-.27 7.65 7.65 0 0 1 2 .27c1.53-1.034 2.2-.82 2.2-.82.435 1.104.161 1.918.08 2.12.513.559.823 1.273.823 2.145 0 3.07-1.87 3.745-3.65 3.943.288.248.543.737.543 1.485 0 1.073-.01 1.94-.01 2.203 0 .215.15.466.55.387A8.003 8.003 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          </>
        )}
      </div>
      {/* Render the AddClothingModal when isModalOpen is true */}
      {isModalOpen && <AddClothingModal onClose={toggleModal} />}
    </header>
  );
}
