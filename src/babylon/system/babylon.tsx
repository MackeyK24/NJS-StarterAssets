'use client';

import { Scene } from "@babylonjs/core/scene";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Nullable } from "@babylonjs/core/types";
import { Observer } from "@babylonjs/core/Misc/observable";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { SceneManager, ScriptComponent, Utilities } from "@babylonjs-toolkit/next";
import { useCallback } from "react";
import { useUnifiedNavigation, UnifiedNavigateFunction, LocationState } from "./platform";
import BaseSceneViewer from "./viewer";
import CustomOverlay from "../custom/overlay";
import GameManager from "../globals";
import "./babylon.css";

export declare type SceneViewerProps = {
  rootPath?: string;
  sceneFile?: string;
  auxiliaryData?: any;
  allowQueryParams?: boolean;
  enableCustomOverlay?: boolean;
};

/**
 * ES6 Interactive Babylon Toolkit Scene Viewer (GLTF)
 * Example: navigate('/play', { state: { fromApp: true, rootPath: '/scenes/', sceneFile: 'sampleScene.gltf', auxiliaryData: null } });
 * @param fromApp navigation flag
 * @param rootPath scene location
 * @param sceneFile scene filename
 * @param auxiliaryData aux data string
 */

function BabylonSceneViewer(props: SceneViewerProps & React.CanvasHTMLAttributes<HTMLCanvasElement>) {
  const { rootPath, sceneFile, auxiliaryData, allowQueryParams, enableCustomOverlay } = props;
  const { navigate, location } = useUnifiedNavigation();
  const createScene = useCallback(async (scene:Scene) => {
    if (scene.isDisposed) return; // Note: Strict mode safety
    let disposed = false;
    let disposeObserver = scene.onDisposeObservable.add(() => { disposed = true; });
    let assetsManager: AssetsManager | null = null;

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    // STEP 1 - Initialize the global runtime scene properties and react navigation system
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    try {
      await GameManager.InitializeRuntime(scene, navigate, true, true, false);
      if (disposed || scene.isDisposed) return; // Note: Strict mode safety
    
      ////////////////////////////////////////////////////////////////////////////////////////////////////////
      // STEP 2 - Load the babylon scene assets (GLTF) using the toolkit assets manager
      ////////////////////////////////////////////////////////////////////////////////////////////////////////
      let isDevelopment: boolean = process.env.NODE_ENV === "development";
      let defaultPageUrl: URL = new URL(window.location.href.replace("#?", "?"));
      let babylonRootPath: string = rootPath || "/scenes/";
      let babylonSceneFile: string = sceneFile || "mainmenu.gltf";
      let babylonAuxiliaryData:string = auxiliaryData || null;
      if (allowQueryParams === true) {
        babylonRootPath = location?.state?.rootPath || babylonRootPath;
        babylonSceneFile = location?.state?.sceneFile || babylonSceneFile;
        babylonAuxiliaryData = location?.state?.auxiliaryData || babylonAuxiliaryData;
        if (isDevelopment === true) {
          babylonRootPath = defaultPageUrl.searchParams.get("root") || babylonRootPath;
          babylonSceneFile = defaultPageUrl.searchParams.get("scene") || babylonSceneFile;
          babylonAuxiliaryData = defaultPageUrl.searchParams.get("aux") || babylonAuxiliaryData;
        }
      }
      if (babylonAuxiliaryData != null && babylonAuxiliaryData !== "") {
        SceneManager.SetAuxiliaryData(scene, babylonAuxiliaryData);
      }
      if ((babylonRootPath != null && babylonRootPath !== "" && babylonRootPath.toLowerCase() === "_blank") || (babylonSceneFile != null && babylonSceneFile !== "" && babylonSceneFile.toLowerCase() === "_blank")) {
          GameManager.EventBus.PostMessage("OnSceneReady", { scene, rootPath: babylonRootPath, sceneFile: babylonSceneFile });
          SceneManager.HideLoadingScreen(scene.getEngine());
          SceneManager.FocusRenderCanvas(scene);
          return; // Note: Bail Out Early
      }
      assetsManager = new AssetsManager(scene);
      assetsManager.addMeshTask("BabylonScene", null, babylonRootPath, babylonSceneFile);
      await SceneManager.LoadRuntimeAssets(assetsManager, [babylonSceneFile], async () => {
      if (disposed || scene.isDisposed) return; // Note: Strict mode safety

        /////////////////////////////////////////////////////////////////////////////////////////////////////
        // STEP 3 - Finalize scene setup after assets are loaded and hide the loading screen
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        GameManager.EventBus.PostMessage("OnSceneReady", { scene, rootPath: babylonRootPath, sceneFile: babylonSceneFile });
        SceneManager.HideLoadingScreen(scene.getEngine());
        SceneManager.FocusRenderCanvas(scene);
      });
    } catch (error) {
      console.error("Failed to load babylon scene assets", error);
    } finally {
      assetsManager = null;
      if (!disposed && !scene.isDisposed && disposeObserver) {
        scene.onDisposeObservable.remove(disposeObserver);
      }
    }
  }, [rootPath, sceneFile, auxiliaryData, allowQueryParams, location, navigate]);

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  // OPTIONAL: Add custom loading div over the root div and disable the default loading screen
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (    
    <div className="viewer">
      <BaseSceneViewer webgpu={true} antialias={true} adaptToDeviceRatio={true} onCreateScene={createScene} className="canvas" />
      {props.enableCustomOverlay && <CustomOverlay />}
    </div>
  );
}

export default BabylonSceneViewer;