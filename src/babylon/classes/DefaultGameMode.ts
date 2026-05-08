import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core";
import { SceneManager, ScriptComponent, LocalMessageBus } from "@babylonjs-toolkit/next";
import GameManager from "../globals";

export class DefaultGameMode extends ScriptComponent {

    constructor(transform: TransformNode, scene: Scene, properties: any = {}, alias: string = "DefaultGameMode") {
        super(transform, scene, properties, alias);
        GameManager.EventBus.OnMessage("OnSceneReady", (data: any) => { this.onSceneReady(data); });
    }

    protected onSceneReady(data: any): void {
        console.log("DefaultGameMode - OnSceneReady():", data);
    }
}

SceneManager.RegisterClass("DefaultGameMode", DefaultGameMode);