'use client';

import { useUnifiedNavigation } from "../system/platform";

export default function PlayDemoButton() {
  const { navigate } = useUnifiedNavigation();

  return (
    <button onClick={() => navigate("/play", { state: { fromApp: true, rootPath: "/scenes/", sceneFile: "samplescene.gltf" } })} className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]">
      Play Demo
    </button>
  );
}