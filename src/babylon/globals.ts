'use client';

import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";
import { SceneManager, LocalMessageBus } from "@babylonjs-toolkit/next";

class GameManager {
    /** Initialize the game runtime environment */
    public static async InitializeRuntime(scene:Scene, navigateToFunction:any = null, enablePhysics:boolean = true, showLoadingScreen:boolean = true, hideEngineLoadingUI:boolean = false): Promise<void> {
        if (scene.isDisposed) return; // Note: Strict mode safety
        await SceneManager.InitializeRuntime(scene.getEngine(), { showDefaultLoadingScreen: showLoadingScreen, hideLoadingUIWithEngine: hideEngineLoadingUI });
        if (GameManager.IsDevelopmentMode) await import("@babylonjs/inspector");
        await import("@babylonjs-toolkit/dlc/DebugInformation");
        await import("@babylonjs-toolkit/dlc/DefaultCameraSystem");
        await import("@babylonjs-toolkit/dlc/MobileInputController");
        await import("@babylonjs-toolkit/dlc/ThirdPersonPlayerController");
        if (scene.isDisposed) return; // Note: Strict mode safety

        // Set React Navigation Hook (Note: Remark or remove to disable navigation from scene)
        SceneManager.SetReactNavigationHook(scene, navigateToFunction);

        // Havok is only loaded once globally AFTER SceneManager.InitializeRuntime
        if (enablePhysics)
        {
            if (globalThis.HK == null || globalThis.HKP == null)
            {
                globalThis.HK = await HavokPhysics();
                globalThis.HKP = new HavokPlugin(false);
            }
            if (!scene.isDisposed && globalThis.HK != null && globalThis.HKP != null)
            {
                scene.enablePhysics(new Vector3(0,-9.81,0), globalThis.HKP);
            }
            const cleanupGlobals = () =>
            {
                if (globalThis["HKP"]) delete globalThis["HKP"];
                if (globalThis["HK"]) delete globalThis["HK"];
            };
            if (!scene.isDisposed)
            {
                scene.onDisposeObservable.addOnce(cleanupGlobals);
            }
            else
            {
                cleanupGlobals(); // Note: Force clean up if scene was disposed already
            }
        }
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Global Game State
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private static _GlobalState: any = {};
    /** Global game state */
    public static get GlobalState(): any { return GameManager._GlobalState; }
    /** Load global game state from storage */
    public static LoadGameState(storage:StorageType): void {
        if (storage === StorageType.Local) {
            const savedState = localStorage.getItem("GlobalGameState");
            if (savedState) GameManager._GlobalState = JSON.parse(savedState);
        } else if (storage === StorageType.Session) {
            const savedState = sessionStorage.getItem("GlobalGameState");
            if (savedState) GameManager._GlobalState = JSON.parse(savedState);
        }
    }
    /** Save global game state to storage */
    public static SaveGameState(storage:StorageType): void {
        if (storage === StorageType.Local) {
            localStorage.setItem("GlobalGameState", JSON.stringify(GameManager._GlobalState));
        } else if (storage === StorageType.Session) {
            sessionStorage.setItem("GlobalGameState", JSON.stringify(GameManager._GlobalState));
        }
    }
    /** Reset global game state */
    public static ResetGameState(): void {
        GameManager._GlobalState = {};
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Synchronous Message Bus
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private static _SynchronousMessageBus: LocalMessageBus | null = null;
    /** Synchronous event message bus 
     * @examples 
     * // Handle myevent message
     * GameManager.EventBus.OnMessage("myevent", (data:string) => {
     *    console.log("My Event Data: " + data);
     * });
     * // Post myevent message
     * GameManager.EventBus.PostMessage("myevent", "Hello World!");
    */
    public static get EventBus(): LocalMessageBus {
        if (GameManager._SynchronousMessageBus == null) GameManager._SynchronousMessageBus = new LocalMessageBus();
        return GameManager._SynchronousMessageBus;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Development Mode Flag
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    public static get IsDevelopmentMode(): boolean { return process.env.NODE_ENV === "development"; }
}
export enum StorageType { Local = 0, Session = 1 }

export default GameManager;