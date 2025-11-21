import { Suspense } from "react";
import ApplicationRoute from "@/src/babylon/system/routing";
import BabylonSceneViewer from "@/src/babylon/system/babylon";

export default function Play() {
  return (
    <Suspense>
      <ApplicationRoute allowDevMode={true}>
          <BabylonSceneViewer fullPage={true} rootPath="/scenes/" sceneFile="mainmenu.gltf" allowQueryParams={true} enableCustomOverlay={false} />
      </ApplicationRoute>
    </Suspense>
  );
}
