// contexts/HandednessContext.js
"use client";
import { createContext, useContext, useState } from "react";

// Create the context with default values.
const HandednessContext = createContext({
  isLeftHanded: false,
  toggleHandedness: () => {},
});

// Provider component to wrap your app (or a subtree).
export function HandednessProvider({ children }) {
  const [isLeftHanded, setIsLeftHanded] = useState(false);

  const toggleHandedness = () => setIsLeftHanded((prev) => !prev);

  return (
    <HandednessContext.Provider value={{ isLeftHanded, toggleHandedness }}>
      {children}
    </HandednessContext.Provider>
  );
}

// Custom hook for convenience.
export function useHandedness() {
  return useContext(HandednessContext);
}
