import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { SceneManager, ScriptComponent, LocalMessageBus } from "@babylonjs-toolkit/next";
import GameManager from "../globals";

export class FreeCameraMode extends ScriptComponent {
    private readonly onSceneReadyHandler = (data: any) => { this.onSceneReady(data); };

    private camera: FreeCamera | null = null;

    constructor(transform: TransformNode, scene: Scene, properties: any = {}, alias: string = "FreeCameraMode") {
        super(transform, scene, properties, alias);
        GameManager.EventBus.OnMessage("OnSceneReady", this.onSceneReadyHandler);
    }

    protected onSceneReady(data: any): void {
        setTimeout(() => { // Note: Timeout is a workaround to ensure this runs after the scene ready event processing completes
            this.finishSceneReady(data);
        }, 1000);
    }

    protected finishSceneReady(data: any): void {
        console.log("FreeCameraMode - Ready");
        this.camera = new FreeCamera("FreeCamera", new Vector3(0, 5, -10), this.scene);
        const canvas = this.scene.getEngine().getRenderingCanvas();
        if (canvas)this.camera.attachControl(canvas, true);
    }

    public override dispose(): void {
        GameManager.EventBus.RemoveHandler("OnSceneReady", this.onSceneReadyHandler);
        super.dispose();
    }
}

SceneManager.RegisterClass("FreeCameraMode", FreeCameraMode);