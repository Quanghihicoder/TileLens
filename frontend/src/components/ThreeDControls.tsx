import React from "react";

interface ThreeDControlsProps {
  isThreeDViewing: boolean;
  onToggleThreeDViewing: () => void;
}

export const ThreeControls: React.FC<ThreeDControlsProps> = ({
  isThreeDViewing,
  onToggleThreeDViewing,
}) => {
  return (
    <div className="fixed hidden top-23 left-2 md:left-6 z-10 md:flex flex-col gap-5 rounded-2xl">
      <button
        className={`p-2 ${
          isThreeDViewing ? "bg-blue-600" : "bg-gray-600"
        } rounded-2xl`}
        onClick={onToggleThreeDViewing}
      >
        <div className="w-9 h-9 rounded-full bg-white shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400 text-xl">
          🧊
        </div>
      </button>
    </div>
  );
};
