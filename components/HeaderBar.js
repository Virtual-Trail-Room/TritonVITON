// components/HeaderBar.js
"use client";

import { useState } from "react";
import Link from "next/link";
import DarkModeToggle from "./DarkModeToggle";
import AddClothingModal from "./AddClothingModal";

export default function HeaderBar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen((prev) => !prev);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between
                   px-4 py-3 bg-white shadow-md dark:bg-gray-800"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          TritonVITON
        </h1>
        <div className="flex items-center gap-4">
          <DarkModeToggle />

          <Link
            href="/info"
            className="flex items-center justify-center w-10 h-10
                       rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
            aria-label="Project Information"
          >
            i
          </Link>

          <Link
            href="https://github.com/Virtual-Trail-Room/TritonVITON"
            target="_blank"
            className="flex items-center justify-center w-10 h-10
                       rounded-full bg-gray-800 text-white hover:bg-gray-900 transition"
            aria-label="View source on GitHub"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* GitHub “octocat” path */}
              <path d="M12 .297C5.373.297 0 5.67 0 12.297c0 5.292 3.438 9.787 8.205 11.387.6.113.82-.258.82-.577
         0-.285-.01-1.04-.016-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757
         -1.089-.745.083-.73.083-.73 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997
         .108-.776.418-1.305.76-1.605-2.665-.303-5.466-1.334-5.466-5.93 0-1.31.47-2.382 1.235-3.222
         -.123-.303-.536-1.523.117-3.176 0 0 1.008-.323 3.301 1.23.957-.266 1.984-.399 3.005-.404
         1.02.005 2.048.138 3.006.404 2.292-1.553 3.297-1.23 3.297-1.23.655 1.653.242 2.873.119 3.176
         .77.84 1.233 1.912 1.233 3.222 0 4.61-2.804 5.625-5.475 5.921.43.372.824 1.102.824 2.222
         0 1.606-.015 2.896-.015 3.293 0 .32.216.694.825.576C20.565 22.084 24 17.588 24 12.297
         24 5.67 18.627.297 12 .297z" />
            </svg>
          </Link>

          {/* Add Item button */}
          <button
            onClick={toggleModal}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            aria-label="Add new clothing item"
          >
            Add Item
          </button>
        </div>
      </header>

      {isModalOpen && <AddClothingModal onClose={toggleModal} />}
    </>
  );
}
