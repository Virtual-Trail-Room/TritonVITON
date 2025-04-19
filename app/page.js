"use client";

import { useState, useEffect } from "react";
import HeaderBar from "../components/HeaderBar";
import VideoFeed from "../components/VideoFeed";
import SideMenu from "../components/SideMenu";
import ClothingList from "../components/ClothingList";
import AddClothingModal from "../components/AddClothingModal";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Blouses");
  const [cursor, setCursor] = useState({
    x: 0, y: 0, click: false, dragging: false
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // center the cursor on mount
  useEffect(() => {
    setCursor({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      click: false,
      dragging: false,
    });
  }, []);

  return (
    <>
      <HeaderBar />

      <div className="relative h-screen w-screen pt-16"> 
        {/* Only one VideoFeed! */}
        <VideoFeed
          onCursorUpdate={setCursor}
          onSimulatedClick={(el) => el?.click?.()}
        />

        {/* Left side menu */}
        <div className="absolute top-16 left-0 z-20 h-[calc(100%-4rem)] w-72 
                        bg-black bg-opacity-60 overflow-y-auto">
          <SideMenu
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        </div>

        {/* Right clothing list */}
        <div className="absolute top-16 right-0 z-20 h-[calc(100%-4rem)] w-72 
                        bg-black bg-opacity-60 overflow-y-auto">
          <ClothingList
            selectedCategory={selectedCategory}
            cursor={cursor}
          />
        </div>

        {/* Add button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="absolute bottom-8 right-8 z-20 px-6 py-3 
                     bg-green-500 text-white rounded-full shadow-lg 
                     hover:bg-green-600 transition"
        >
          Add Clothing
        </button>
      </div>

      {isAddModalOpen && (
        <AddClothingModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </>
  );
}
