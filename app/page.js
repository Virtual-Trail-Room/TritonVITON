"use client";
import Head from "next/head";
import Script from "next/script";
import { useState, useEffect } from "react";
import SideMenu from "../components/SideMenu";
import VideoFeed from "../components/VideoFeed";
import ClothingList from "../components/ClothingList";
import AddClothingItem from "../components/AddClothingItem";
import { useHandedness } from "../contexts/HandednessContext";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Blouses");
  const [cursor, setCursor] = useState({
    x: 0,
    y: 0,
    click: false,
    dragging: false,
  });

  // Get handedness value from context.
  const { isLeftHanded } = useHandedness();

  // Update initial cursor position on client.
  useEffect(() => {
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
        <VideoFeed onCursorUpdate={handleCursorUpdate} onSimulatedClick={handleSimulatedClick} />

        {/* Layout for Left-Handed vs. Right-Handed */}
        {isLeftHanded ? (
          <>
            {/* Left-Handed Layout: Clothing list and AddClothingItem on left; SideMenu on right */}
            <div className="absolute top-0 left-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
              <ClothingList selectedCategory={selectedCategory} cursor={cursor} />
              <AddClothingItem />
            </div>
            <div className="absolute top-0 right-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
              <SideMenu selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} />
            </div>
          </>
        ) : (
          <>
            {/* Right-Handed Layout: SideMenu on left; ClothingList and AddClothingItem on right */}
            <div className="absolute top-0 left-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
              <SideMenu selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} />
            </div>
            <div className="absolute top-0 right-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
              <ClothingList selectedCategory={selectedCategory} cursor={cursor} />
              <AddClothingItem />
            </div>
          </>
        )}
      </div>
    </>
  );
}
