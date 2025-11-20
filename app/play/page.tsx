import BabylonSceneViewer from "../../src/babylon/system/babylon";
import ApplicationRoute from "../../src/babylon/system/routing";

export default function Play() {
  return (
    <ApplicationRoute allowDevMode={true}>
      <BabylonSceneViewer rootPath="/scenes/" sceneFile="samplescene.gltf" allowQueryParams={true} enableCustomOverlay={false} />
    </ApplicationRoute>
  );
}
