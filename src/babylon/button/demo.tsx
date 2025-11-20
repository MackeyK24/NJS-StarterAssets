'use client';

import { Suspense } from "react";
import { useUnifiedNavigation } from "../system/platform";

function PlayDemoButtonContent() {
  const { navigate } = useUnifiedNavigation();

  return (
    <button className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
      onClick={() => navigate("/play", { state: { fromApp: true, rootPath: "/scenes/", sceneFile: "samplescene.gltf" } })}
    >
      Play Demo
    </button>
  );
}

export default function PlayDemoButton() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayDemoButtonContent />
    </Suspense>
  );
}