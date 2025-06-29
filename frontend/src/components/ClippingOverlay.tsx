import React from "react";
import {
  calculateDistance,
  angleWithYAxis,
  type Point,
} from "../utilities/math";

interface ClippingOverlayProps {
  clippingPath: Point[];
}

export const ClippingOverlay: React.FC<ClippingOverlayProps> = ({
  clippingPath,
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
            className="absolute z-20 origin-top-left"
            style={{
              left: `${current.x}px`,
              top: `${current.y}px`,
              width: 1.5,
              height: `${length}px`,
              transform: `rotate(${rotate}deg)`,
              background: `${i === clippingPath.length - 1 ? "blue" : "red"}`,
            }}
          ></div>
        );
      })}
    </>
  );
};
