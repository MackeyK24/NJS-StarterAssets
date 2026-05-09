import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core";
import { SceneManager, ScriptComponent, LocalMessageBus } from "@babylonjs-toolkit/next";
import { ThirdPersonPlayerController } from "@babylonjs-toolkit/dlc";
import GameManager from "../globals";

export class RaycastVehicleDemo extends ScriptComponent {
    private readonly onSceneReadyHandler = (data: any) => { this.onSceneReady(data); };

    constructor(transform: TransformNode, scene: Scene, properties: any = {}, alias: string = "RaycastVehicleDemo") {
        super(transform, scene, properties, alias);
        GameManager.EventBus.OnMessage("OnSceneReady", this.onSceneReadyHandler);
    }

    protected onSceneReady(data: any): void {
        console.log("RaycastVehicleDemo - Ready");
        try {
            const mustang = this.scene.getNodeByName("RiggedMustang") as TransformNode;
            if (mustang != null) {
                console.log("Setup vehicle controller for mustang prefab: ", mustang);
            }
        } catch (e) {
            console.error("Failed to attach vehicle controller", e);
        }
    }

    public override dispose(): void {
        GameManager.EventBus.RemoveHandler("OnSceneReady", this.onSceneReadyHandler);
        super.dispose();
    }
}

SceneManager.RegisterClass("RaycastVehicleDemo", RaycastVehicleDemo);