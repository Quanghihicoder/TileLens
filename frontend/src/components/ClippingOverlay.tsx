import React from "react";
import { calculateDistance, angleWithYAxis } from "../utilities/math";
import { type Point } from "../types";

interface ClippingOverlayProps {
  clippingPath: Point[];
  editPointIndex: number | null;
  isEditClipping: boolean;
  onLineBreak: (e: React.MouseEvent, index: number) => void;
  setEditPointIndex: (index: number) => void;
}

export const ClippingOverlay: React.FC<ClippingOverlayProps> = ({
  clippingPath,
  editPointIndex,
  isEditClipping,
  onLineBreak,
  setEditPointIndex,
}) => {
  return (
    <>
      {clippingPath.map((point, i) => {
        if (i === clippingPath.length - 1 && clippingPath.length === 2) {
          return null;
        }

        const current = point;
        const next = clippingPath[(i + 1) % clippingPath.length];
        const length = calculateDistance(current, next);
        const rotate = -1 * angleWithYAxis(current, next);

        return (
          <div
            key={i}
            className={`absolute z-20 origin-top-left  ${
              isEditClipping && "cursor-pointer"
            }`}
            style={{
              left: `${current.x}px`,
              top: `${current.y}px`,
              width: 2,
              height: `${length}px`,
              transform: `rotate(${rotate}deg)`,
              background: `${i === clippingPath.length - 1 ? "blue" : "red"}`,
            }}
            onClick={(e) => {
              if (i !== clippingPath.length - 1) {
                e.stopPropagation();
                onLineBreak(e, i);
              }
            }}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                setEditPointIndex(i);
              }}
              className={`absolute z-30 origin-top-left rounded-full ${
                editPointIndex == i && "cursor-grab"
              }`}
              style={{
                left: -6,
                top: -6,
                width: 12,
                height: 12,
                background: `${
                  editPointIndex != null && editPointIndex == i
                    ? "yellow"
                    : i === clippingPath.length - 1
                    ? "blue"
                    : "red"
                }`,
              }}
            ></div>
          </div>
        );
      })}
    </>
  );
};
