"use client";
import Head from "next/head";
import Script from "next/script";
import { useState, useEffect } from "react";
import SideMenu from "../components/SideMenu";
import VideoFeed from "../components/VideoFeed";
import ClothingList from "../components/ClothingList";
import AddClothingItem from "../components/AddClothingItem";
<<<<<<< HEAD
import DarkModeToggle from "../components/DarkModeToggle";
=======
>>>>>>> b8a709c (Addition of YOLO, improved front-end, working mongo backend, cloudinary implementation, early rough implementation of adding new images, working clicking (part 1))

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Blouses");
  // Initialize with safe default values and update on client mount
  const [cursor, setCursor] = useState({
    x: 0,
    y: 0,
    click: false,
    dragging: false,
  });
  const [isLeftHanded, setIsLeftHanded] = useState(false);

  useEffect(() => {
    // Only on the client, update the cursor initial values
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

<<<<<<< HEAD
  const handleCursorUpdate = (pos) => {
    setCursor(pos);
=======
  const handlePoseUpdate = (keypoints) => {
    console.log("YOLO Pose keypoints updated:", keypoints);
>>>>>>> b8a709c (Addition of YOLO, improved front-end, working mongo backend, cloudinary implementation, early rough implementation of adding new images, working clicking (part 1))
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
<<<<<<< HEAD
        <title>Modern Gesture-Controlled Clothing Selector</title>
        <meta name="description" content="Modern UI with gesture control and YOLO pose detection." />
=======
        <title>Gesture & YOLO Pose Demo</title>
        <meta name="description" content="Real-time YOLO Pose overlay with webcam feed." />
>>>>>>> b8a709c (Addition of YOLO, improved front-end, working mongo backend, cloudinary implementation, early rough implementation of adding new images, working clicking (part 1))
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
<<<<<<< HEAD

      {/* Top Right Controls */}
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
        <VideoFeed onCursorUpdate={handleCursorUpdate} onSimulatedClick={handleSimulatedClick} />

        {/* Layout for Right-Handed Mode */}
        {!isLeftHanded && (
          <>
            <div className="absolute top-0 left-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
              <SideMenu selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} />
            </div>
            <div className="absolute top-0 right-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
              <ClothingList selectedCategory={selectedCategory} cursor={cursor} />
              <AddClothingItem />
            </div>
          </>
        )}

        {/* Layout for Left-Handed Mode */}
        {isLeftHanded && (
          <>
            <div className="absolute top-0 left-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
              <ClothingList selectedCategory={selectedCategory} cursor={cursor} />
              <AddClothingItem />
            </div>
            <div className="absolute top-0 right-0 h-screen w-[300px] bg-black bg-opacity-60 overflow-y-auto">
              <SideMenu selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} />
            </div>
          </>
        )}
=======
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
>>>>>>> b8a709c (Addition of YOLO, improved front-end, working mongo backend, cloudinary implementation, early rough implementation of adding new images, working clicking (part 1))
      </div>
    </>
  );
}
