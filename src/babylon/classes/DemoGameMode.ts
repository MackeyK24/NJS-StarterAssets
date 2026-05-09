import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core";
import { SceneManager, ScriptComponent, LocalMessageBus } from "@babylonjs-toolkit/next";
import { ThirdPersonPlayerController } from "@babylonjs-toolkit/dlc";
import GameManager from "../globals";

export class DemoGameMode extends ScriptComponent {
    private readonly onSceneReadyHandler = (data: any) => { this.onSceneReady(data); };

    constructor(transform: TransformNode, scene: Scene, properties: any = {}, alias: string = "DemoGameMode") {
        super(transform, scene, properties, alias);
        GameManager.EventBus.OnMessage("OnSceneReady", this.onSceneReadyHandler);
    }

    protected onSceneReady(data: any): void {
        console.log("DemoGameMode - OnSceneReady():", data);
        try {
            const player = this.scene.getNodeByName("PlayerArmature") as TransformNode;
            if (player != null) {
                const controller = new ThirdPersonPlayerController(player, this.scene, { arrowKeyRotation: true, smoothMotionSpeed:true, smoothChangeRate: 25.0 });
                controller.enableInput = true;
                controller.attachCamera = true;
                controller.moveSpeed = 5.335;
                controller.walkSpeed = 2.0;
                controller.jumpSpeed = 12.0;
            }
        } catch (e) {
            console.error("Failed to attach player controller", e);
        } finally {
            SceneManager.HideLoadingScreen(this.scene.getEngine());
            SceneManager.FocusRenderCanvas(this.scene);
        }
    }

    public override dispose(): void {
        GameManager.EventBus.RemoveHandler("OnSceneReady", this.onSceneReadyHandler);
        super.dispose();
    }
}

SceneManager.RegisterClass("DemoGameMode", DemoGameMode);