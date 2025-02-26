"use client";
import Head from "next/head";
import Script from "next/script";
import { useState } from "react";
import SideMenu from "../components/SideMenu";
import VideoFeed from "../components/VideoFeed";
import ClothingList from "../components/ClothingList";
import "../src/app/globals.css"

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Tops");

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    console.log("Category selected:", cat);
  };

  const handleCursorUpdate = (coords) => {
    console.log("Cursor updated:", coords);
  };

  const handleSimulatedClick = (el) => {
    console.log("Simulated click on:", el);
    el.click();
  };

  return (
    <>
      <Head>
        <title>Gesture-Based Clothing Selector</title>
        <meta name="description" content="Gesture-controlled clothing selector using MediaPipe Hands." />
      </Head>
      {/* Load CDN scripts so that MediaPipe drawing utilities attach to window */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0"
        strategy="beforeInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
        strategy="beforeInteractive"
      />
      <div className="flex h-screen">
        {/* Left Panel */}
        <div className="w-1/5">
          <SideMenu selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} />
        </div>
        {/* Middle Panel */}
        <div className="w-3/5 flex justify-center items-center bg-gray-200">
          <VideoFeed onCursorUpdate={handleCursorUpdate} onSimulatedClick={handleSimulatedClick} />
        </div>
        {/* Right Panel */}
        <div className="w-1/5">
          <ClothingList />
        </div>
      </div>
    </>
  );
}
