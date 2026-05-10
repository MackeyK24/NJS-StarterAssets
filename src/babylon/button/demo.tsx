'use client';

import { SceneManager, ScriptComponent, Utilities } from "@babylonjs-toolkit/next";
import { useUnifiedNavigation } from "../system/platform";
import GameManager from "../globals";

export default function PlayDemoButton() {
  const { navigate } = useUnifiedNavigation();

  return (
    <div className="nx-card">
      <button onClick={() => navigate("/play", { state: { fromApp: true, gameMode: "PlayerControllerDemo", rootPath: GameManager.AwsPlaygroundRepo, sceneFile: "samplescene.gltf", importMeshes: ["playerarmature.gltf"], hideSplashScreen: true } })} className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]">Play Demo</button>
    </div>
  );
}