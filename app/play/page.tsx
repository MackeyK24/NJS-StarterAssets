import { Suspense } from "react";
import { DefaultBabylonPreloader } from "@/src/babylon/custom/loading";
import ApplicationRoute from "@/src/babylon/system/routing";
import BabylonSceneViewer from "@/src/babylon/system/babylon";

export default function Play() {
  return (
    <Suspense fallback={<DefaultBabylonPreloader />}>
      <ApplicationRoute allowDevMode={true}>
          <BabylonSceneViewer fullPage={true} allowQueryParams={true} enableCustomOverlay={false} />
      </ApplicationRoute>
    </Suspense>
  );
}
