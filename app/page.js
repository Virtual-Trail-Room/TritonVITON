"use client";
import Head from "next/head";
import Script from "next/script";
import { useState } from "react";
import SideMenu from "../components/SideMenu";
import VideoFeed from "../components/VideoFeed";
import ClothingList from "../components/ClothingList";
import AddClothingItem from "../components/AddClothingItem";
import DarkModeToggle from "../components/DarkModeToggle";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Blouses");
  const [cursor, setCursor] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    click: false,
    dragging: false,
  });
  const [isLeftHanded, setIsLeftHanded] = useState(false);

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
        <meta name="description" content="Modern UI with gesture control and YOLO pose detection." />
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
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-40 flex gap-4">
        <DarkModeToggle />
        <button
          onClick={() => setIsLeftHanded((prev) => !prev)}
          className="bg-gray-700 text-white px-4 py-2 rounded shadow"
        >
          {isLeftHanded ? "Right-Handed Users" : "Left-Handed Users"}
        </button>
      </div>
      {/* Main Video Background */}
      <div className="relative h-screen w-screen overflow-hidden">
        <VideoFeed
          onCursorUpdate={handleCursorUpdate}
          onSimulatedClick={handleSimulatedClick}
        />
        {/* Scrollable container for ClothingList */}
        <div className="absolute top-0 right-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
          <ClothingList selectedCategory={selectedCategory} cursor={cursor} />
        </div>
        {/* Optional SideMenu on the left */}
        <div className="absolute top-0 left-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
          <SideMenu selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} />
        </div>
        {/* Floating AddClothingItem button */}
        <div className="absolute bottom-4 right-4 z-50">
          <AddClothingItem />
        </div>
      </div>
    </>
  );
}
