import { Suspense } from "react";
import BabylonSceneViewer from "../../src/babylon/system/babylon";
import ApplicationRoute from "../../src/babylon/system/routing";

export default function Play() {
  return (
    <Suspense>
      <ApplicationRoute allowDevMode={true}>
          <BabylonSceneViewer fullPage={true} rootPath="/scenes/" sceneFile="mainmenu.gltf" allowQueryParams={true} enableCustomOverlay={false} />
      </ApplicationRoute>
    </Suspense>
  );
}
