// app/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import HeaderBar from "../components/HeaderBar";
import VideoFeed from "../components/VideoFeed";
import SideMenu from "../components/SideMenu";
import ClothingList from "../components/ClothingList";
import AddClothingModal from "../components/AddClothingModal";
import AddTryOnModal   from "../components/AddTryOnModal";  // ← your new try-on modal
import { useRouter } from "next/navigation";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Blouses");
  const router = useRouter();
  const [cursor, setCursor] = useState({
    x: 0, y: 0, click: false, dragging: false
  });
  const [isAddClothingOpen, setAddClothingOpen] = useState(false);
  const [isTryOnOpen, setTryOnOpen]             = useState(false);
  // Refs for the live video feed
  const camRef = useRef(null);
  const [processedFrame, setProcessedFrame] = useState(null);

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
        {/* Video + hand tracking */}
        <VideoFeed
          ref={camRef}
          onCursorUpdate={setCursor}
          onSimulatedClick={(el) => el?.click?.()}
          processedFrame={processedFrame}

        />

        {/* Left panel */}
        <div className="absolute top-16 left-0 z-20 h-[calc(100%-4rem)] w-72 
                        bg-black bg-opacity-60 overflow-y-auto">
          <SideMenu
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        </div>

        {/* Right panel */}
        <div className="absolute top-16 right-0 z-20 h-[calc(100%-4rem)] w-72 
                        bg-black bg-opacity-60 overflow-y-auto">
          <ClothingList
            selectedCategory={selectedCategory}
            cursor={cursor}
          />
        </div>

        {/* Bottom-right buttons */}
        <div className="absolute bottom-8 right-8 z-20 flex flex-col space-y-3">
          <button
            onClick={() => setAddClothingOpen(true)}
            className="px-6 py-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition"
          >
            Add Clothing
          </button>
          <button
            onClick={() => setTryOnOpen(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition"
          >
            Virtual Try-On
          </button>

          <button
            onClick={()=>router.push("/tryon")}
            className="px-6 py-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition"
          >
            Go to Try-On Room
          </button>
        </div>
      </div>

      {isAddClothingOpen && (
        <AddClothingModal onClose={() => setAddClothingOpen(false)} />
      )}
      {isTryOnOpen && (
        // <AddTryOnModal
        //   videoRef={camRef}
        //   onClose={() => setTryOnOpen(false)}
        // />
        <AddTryOnModal
          onClose={() => setTryOnOpen(false)}
          videoRef={camRef}
          setProcessedFrame={setProcessedFrame}  
        />
      )}
    </>
  );
}
