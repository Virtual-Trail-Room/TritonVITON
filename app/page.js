"use client";
import Head from "next/head";
import Script from "next/script";
import { useState } from "react";
import SideMenu from "../components/SideMenu";
import VideoFeed from "../components/VideoFeed";
import ClothingList from "../components/ClothingList";
import AddClothingItem from "../components/AddClothingItem";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Tops");

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    console.log("Category selected:", cat);
  };

  const handlePoseUpdate = (keypoints) => {
    console.log("YOLO Pose keypoints updated:", keypoints);
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
        <title>Gesture & YOLO Pose Demo</title>
        <meta name="description" content="Real-time YOLO Pose overlay with webcam feed." />
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
      <div className="flex h-screen">
        {/* Left Panel: Side Menu */}
        <div className="w-1/6 bg-gray-900 text-white p-4">
          <SideMenu selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} />
        </div>
        {/* Middle Panel: Video Feed */}
        <div className="flex-1 bg-gray-800 relative">
          <VideoFeed onPoseUpdate={handlePoseUpdate} onSimulatedClick={handleSimulatedClick} />
        </div>
        {/* Right Panel: Clothing List and Add Form */}
        <div className="w-1/6 bg-gray-900 text-white p-4 overflow-y-auto">
          <ClothingList selectedCategory={selectedCategory} />
          <AddClothingItem />
        </div>
      </div>
    </>
  );
}
