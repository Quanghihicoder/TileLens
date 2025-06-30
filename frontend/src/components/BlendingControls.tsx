import React from "react";

interface BlendingControlsProps {
  isSendingBlending: boolean;
  onBlend: () => Promise<void>;
  onToggleBlending: () => void;
}

export const BlendingControls: React.FC<BlendingControlsProps> = ({
  isSendingBlending,
  onBlend,
  onToggleBlending,
}) => {
  return (
    <div className="fixed hidden bottom-6 left-2 md:left-6 z-10 md:flex flex-col gap-0 rounded-2xl">
      <button
        disabled={isSendingBlending}
        className="px-2 pt-2 pb-1 bg-green-600 rounded-t-2xl"
        onClick={onBlend}
      >
        <div className="w-9 h-9 rounded-full bg-white shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400 text-xl">
          ✔️
        </div>
      </button>

      <button
        disabled={isSendingBlending}
        className={`px-2 pt-1 pb-2 bg-red-600 rounded-b-2xl`}
        onClick={onToggleBlending}
      >
        <div
          className={`w-9 h-9 rounded-full bg-white text-gray-800 shadow-md border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400 ${"text-xl"}`}
        >
          ❌
        </div>
      </button>
    </div>
  );
};
