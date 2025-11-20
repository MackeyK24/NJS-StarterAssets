import { Suspense } from "react";
import BabylonSceneViewer from "../../src/babylon/system/babylon";
import ApplicationRoute from "../../src/babylon/system/routing";

function PlayContent() {
  return (
    <ApplicationRoute allowDevMode={true}>
      <BabylonSceneViewer rootPath="/scenes/" sceneFile="samplescene.gltf" allowQueryParams={true} enableCustomOverlay={false} />
    </ApplicationRoute>
  );
}

export default function Play() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayContent />
    </Suspense>
  );
}
