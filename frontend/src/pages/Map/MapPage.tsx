import { Viewer, Entity } from "resium";
import { Cartesian3 } from "cesium";

// Ion.defaultAccessToken =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4ZTkxMzFlOS04N2RlLTRlNTQtOTIzZC1kYzU0NzJmNmRmZjIiLCJpZCI6MzI0MjMyLCJpYXQiOjE3NTMyNjIwNTV9.yeH9peNC58v53sF_EeivbKgouwd4J_bamOezPL4aW2E";

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
