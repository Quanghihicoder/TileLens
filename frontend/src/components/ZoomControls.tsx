import React from "react";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <div className="fixed bottom-6 right-2 md:right-6 z-10 flex flex-col gap-2 p-2 rounded-2xl bg-blue-600">
      <button
        className="w-9 h-9 rounded-full bg-white text-gray-800 shadow-md border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400"
        onClick={() => {
          onZoomIn();
        }}
      >
        +
      </button>
      <button
        className="w-9 h-9 rounded-full bg-white text-gray-800 shadow-md border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400"
        onClick={() => {
          onZoomOut();
        }}
      >
        −
      </button>
    </div>
  );
};
