"use client";
import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

/** Really just a <canvas> that always fills its parent. */
export default forwardRef(function OutputCanvas(_, ref) {
  const local = useRef(null);
  useImperativeHandle(ref, () => local.current);

  // make sure it matches the parent size on first paint + resize
  useEffect(() => {
    function fit() {
      if (!local.current) return;
      const { offsetWidth:w, offsetHeight:h } = local.current.parentNode;
      local.current.width  = w;
      local.current.height = h;
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <canvas
      ref={local}
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
});
