'use client';

import { useUnifiedNavigation } from "../babylon/system/platform";

export default function PlayDemoButton() {
  const { navigate } = useUnifiedNavigation();
  const handlePlayDemo = () => {
    /* Use Native Navigation API to prevent ANY BABYLON CODE from being included in the main bundle.
     * This ensures that Babylon and all related dependencies are only loaded when the user clicks "Play Demo", optimizing initial load performance.
     * Game code should use game manager, for example:
     * GameManager.NavigateTo("/play", {
     *     gameMode: "DefaultGameMode",
     *     sceneUrl: GameManager.PlaygroundRepo + "samplescene.gltf",
     * });
     */
    navigate('/play', {
      state: {
        fromApp: true,
        gameMode: 'DemoGameMode',
        sceneUrl: 'https://dlyp4oy8lme1v.cloudfront.net/playground/samplescene.gltf',
        importMeshes: ['playerarmature.gltf'],
      },
    });
  };

  return (
    <div className="nx-card">
      <button onClick={handlePlayDemo} className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]">Play Demo</button>
    </div>
  );
}