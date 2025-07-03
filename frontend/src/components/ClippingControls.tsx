import React from "react";

interface ClippingControlsProps {
  isClipping: boolean;
  isEditClipping: boolean;
  isSendingClipping: boolean;
  isGenerateCircle: boolean;
  onClip: () => Promise<void>;
  onToggleClipping: () => void;
  onToggleEdit: () => void;
  onGenerateCircle: () => void;
}

export const ClippingControls: React.FC<ClippingControlsProps> = ({
  isClipping,
  isEditClipping,
  isSendingClipping,
  isGenerateCircle,
  onClip,
  onToggleClipping,
  onToggleEdit,
  onGenerateCircle,
}) => {
  return (
    <div className="fixed hidden bottom-6 left-2 md:left-6 z-10 md:flex flex-col gap-5 rounded-2xl">
      {isClipping && (
        <button
          disabled={isSendingClipping}
          className={`p-2 ${
            isGenerateCircle ? "bg-blue-600" : "bg-gray-600"
          } rounded-2xl`}
          onClick={onGenerateCircle}
        >
          <div className="w-9 h-9 rounded-full bg-white shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400 text-xl">
            🔵
          </div>
        </button>
      )}

      {isClipping && (
        <button
          disabled={isSendingClipping}
          className={`p-2 ${
            isEditClipping ? "bg-gray-600" : "bg-blue-600"
          } rounded-2xl`}
          onClick={onToggleEdit}
        >
          <div className="w-9 h-9 rounded-full bg-white shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400 text-xl">
            ✏️
          </div>
        </button>
      )}

      <div className="flex flex-col gap-0 rounded-2xl">
        {isClipping && (
          <button
            disabled={isSendingClipping}
            className="px-2 pt-2 pb-1 bg-green-600 rounded-t-2xl"
            onClick={onClip}
          >
            <div className="w-9 h-9 rounded-full bg-white shadow-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400 text-xl">
              ✔️
            </div>
          </button>
        )}

        <button
          disabled={isSendingClipping}
          className={`px-2 ${
            isClipping
              ? "pt-1 pb-2 bg-red-600 rounded-b-2xl"
              : "py-2 bg-blue-600 rounded-2xl"
          }`}
          onClick={onToggleClipping}
        >
          <div
            className={`w-9 h-9 rounded-full bg-white text-gray-800 shadow-md border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400 ${
              isClipping ? "text-xl" : "text-2xl"
            }`}
          >
            {isClipping ? "❌" : "✂️"}
          </div>
        </button>
      </div>
    </div>
  );
};
