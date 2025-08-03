import { Viewer, Entity } from "resium";
import { Cartesian3 } from "cesium";

const Map = () => {
  const position = Cartesian3.fromDegrees(-74.0707383, 40.7117244, 100);
  const pointGraphics = { pixelSize: 10 };

  return (
    <div className="w-screen flex justify-center items-center bg-black">
    <Viewer className="h-full" fullscreenButton={false} homeButton={false} timeline={false}  >
      <Entity position={position} point={pointGraphics} />
    </Viewer>
    </div>
  );
};

export default Map;
