'use client';

import { Scene } from "@babylonjs/core/scene";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Nullable } from "@babylonjs/core/types";
import { Observer } from "@babylonjs/core/Misc/observable";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";
import { ContainerAssetTask, MeshAssetTask } from "@babylonjs/core/Misc/assetsManager";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { SceneManager, ScriptComponent, Utilities } from "@babylonjs-toolkit/next";
import { useCallback } from "react";
import { useUnifiedNavigation, UnifiedNavigateFunction, LocationState } from "./platform";
import BaseSceneViewer from "./viewer";
import CustomOverlay from "../custom/overlay";
import GameManager from "../globals";
import "./babylon.css";

export declare type SceneViewerProps = {
  fullPage?: boolean;
  gameMode?: string;
  rootPath?: string;
  sceneFile?: string;
  assetFiles?: string[];
  importMeshes?: string[];
  auxiliaryData?: any;
  allowQueryParams?: boolean;
  enableCustomOverlay?: boolean;
};

/**
 * ES6 Interactive Babylon Toolkit Scene Viewer (GLTF)
 * Example: navigate('/play', { state: { fromApp: true, rootPath: '/scenes/', sceneFile: 'sampleScene.gltf' } });
 */

function BabylonSceneViewer(props: SceneViewerProps & React.CanvasHTMLAttributes<HTMLCanvasElement>) {
  const { fullPage, gameMode, rootPath, sceneFile, assetFiles, importMeshes, auxiliaryData, allowQueryParams, enableCustomOverlay } = props;
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
      let babylonGameMode:string | undefined = gameMode;
      let babylonAuxiliaryData:string | undefined = auxiliaryData;
      if (allowQueryParams === true) {
        babylonRootPath = location?.state?.rootPath || babylonRootPath;
        babylonSceneFile = location?.state?.sceneFile || babylonSceneFile;
        babylonGameMode = location?.state?.gameMode || babylonGameMode;
        babylonAuxiliaryData = location?.state?.auxiliaryData || babylonAuxiliaryData;
        if (isDevelopment === true) { // Note: Unity Editor Development Preview Query Param Support
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
      let assetIndex: number = 0;
      let runtimeAssets:string [] = [babylonSceneFile];
      assetsManager = new AssetsManager(scene);
      // Add Primary Scene Load Task (GLTF Scene) - Note: The toolkit will automatically detect and load any additional dependencies referenced by the GLTF file (e.g. textures, binary geometry, etc.)
      const sceneTask: MeshAssetTask = assetsManager.addMeshTask("BabylonScene.Task.0", null, babylonRootPath, babylonSceneFile);
      sceneTask.onError = (task: MeshAssetTask, message?: string, exception?: any) => { console.error(message, exception); };
      // Optional Additional Import Mesh Tasks (GLTF Meshes) - Note: These can be used to preload additional GLTF assets that are not directly referenced by the main scene file but may be needed at runtime (e.g. for dynamic instantiation via script)
      if (importMeshes != null && importMeshes.length > 0) {
        runtimeAssets = runtimeAssets.concat(importMeshes);
        for (const meshFile of importMeshes) {
          assetIndex++;
          const meshTask: MeshAssetTask = assetsManager.addMeshTask(("BabylonScene.Task.Mesh." + assetIndex.toString()), "", babylonRootPath, meshFile);
          meshTask.onError = (task: MeshAssetTask, message?: string, exception?: any) => { console.error(message, exception); };
        }
      }
      // Optional Additional Asset Container Tasks (GLTF Prefabs) - Note: These can be used to preload additional GLTF assets that are not directly referenced by the main scene file but may be needed at runtime (e.g. for dynamic instantiation via script)
      if (assetFiles != null && assetFiles.length > 0) {
        let assetIndex: number = 0;
        runtimeAssets = runtimeAssets.concat(assetFiles);
        for (const assetFile of assetFiles) {
          assetIndex++;
          const assetTask: ContainerAssetTask = assetsManager.addContainerTask(("BabylonScene.Task." + assetIndex.toString()), null, babylonRootPath, assetFile);
          assetTask.onSuccess = (task: ContainerAssetTask) => {
              if (task.loadedContainer != null) {
                  const assetTaskKey: string = task.sceneFilename.toString().toLowerCase();
                  SceneManager.RegisterAssetContainer(scene, assetTaskKey, task.loadedContainer);
              }
          };
          assetTask.onError = (task: ContainerAssetTask, message?: string, exception?: any) => { console.error(message, exception); };
        }
      }
      await SceneManager.LoadRuntimeAssets(assetsManager, runtimeAssets, async () => {
        if (disposed || scene.isDisposed) return; // Note: Strict mode safety

        /////////////////////////////////////////////////////////////////////////////////////////////////////
        // STEP 3 - Finalize scene setup after assets are loaded and hide the loading screen
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        try {
          if (babylonGameMode != null && babylonGameMode !== "") {
            const ScriptComponentClass = Utilities.InstantiateClass(babylonGameMode);
            if (ScriptComponentClass != null) {
                const scriptComponent: ScriptComponent = new ScriptComponentClass(new TransformNode("GameMode", scene), scene, {});
                if (scriptComponent != null) {
                  SceneManager.AttachScriptComponent(scriptComponent, babylonGameMode, false);
                } else {
                  Tools.Warn("Failed to instantiate script class: " + babylonGameMode);
                }
            } else {
                Tools.Warn("Failed to locate script class: " + babylonGameMode);
            }
          }
        } catch (e) {
          console.error("Failed to initialize game mode", e);
        } finally {
          GameManager.EventBus.PostMessage("OnSceneReady", { scene, rootPath: babylonRootPath, sceneFile: babylonSceneFile });
          SceneManager.HideLoadingScreen(scene.getEngine());
          SceneManager.FocusRenderCanvas(scene);
        }
      });
    } catch (error) {
      console.error("Failed to load babylon scene assets", error);
    } finally {
      assetsManager = null;
      if (!disposed && !scene.isDisposed && disposeObserver) {
        scene.onDisposeObservable.remove(disposeObserver);
      }
    }
  }, [rootPath, gameMode, sceneFile, assetFiles, importMeshes, auxiliaryData, allowQueryParams, location, navigate]);

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  // OPTIONAL: Add custom loading div over the root div and disable the default loading screen
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (    
    <div className={fullPage ? "page-viewer" : "div-viewer"}>
      <BaseSceneViewer webgpu={true} antialias={true} adaptToDeviceRatio={true} onCreateScene={createScene} className="canvas" />
      {props.enableCustomOverlay && <CustomOverlay />}
    </div>
  );
}

export default BabylonSceneViewer;