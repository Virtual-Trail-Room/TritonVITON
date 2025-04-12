"use client";
import Head from "next/head";
import Script from "next/script";
import { useState, useEffect } from "react";
import SideMenu from "../components/SideMenu";
import VideoFeed from "../components/VideoFeed";
import ClothingList from "../components/ClothingList";
import AddClothingModal from "../components/AddClothingModal";
import { useHandedness } from "../contexts/HandednessContext";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Blouses");
  const [cursor, setCursor] = useState({
    x: 0,
    y: 0,
    click: false,
    dragging: false,
  });
  // State to control the visibility of the Add Clothing modal.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { isLeftHanded } = useHandedness();

  useEffect(() => {
    // On client-side, update the initial cursor state.
    setCursor({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      click: false,
      dragging: false,
    });
  }, []);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    console.log("Category selected:", cat);
  };

  const handleCursorUpdate = (pos) => {
    setCursor(pos);
  };

  const handleSimulatedClick = (el) => {
    console.log("Simulated click on:", el);
    if (el && typeof el.click === "function") {
      el.click();
    } else if (el) {
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }
  };

  return (
    <>
      <Head>
        <title>Modern Gesture-Controlled Clothing Selector</title>
        <meta
          name="description"
          content="Modern UI with gesture control and YOLO pose detection."
        />
      </Head>
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0"
        strategy="beforeInteractive"
        type="module"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
        strategy="beforeInteractive"
        type="module"
      />

      <div className="relative h-screen w-screen overflow-hidden">
        <VideoFeed
          onCursorUpdate={handleCursorUpdate}
          onSimulatedClick={handleSimulatedClick}
        />

        {isLeftHanded ? (
          // Layout for Left-Handed mode: ClothingList on left; SideMenu on right.
          <>
            <div className="absolute top-0 left-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
              <ClothingList selectedCategory={selectedCategory} cursor={cursor} />
            </div>
            <div className="absolute top-0 right-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
              <SideMenu
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
              />
            </div>
          </>
        ) : (
          // Layout for Right-Handed mode: SideMenu on left; ClothingList on right.
          <>
            <div className="absolute top-0 left-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
              <SideMenu
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
              />
            </div>
            <div className="absolute top-0 right-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
              <ClothingList selectedCategory={selectedCategory} cursor={cursor} />
            </div>
          </>
        )}

        {/* “Add Clothing” Button positioned on top of the video */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="absolute bottom-8 right-8 px-6 py-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          Add Item
        </button>
      </div>

      {/* Conditionally render the AddClothingModal only when isAddModalOpen is true */}
      {isAddModalOpen && (
        <AddClothingModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </>
  );
}
