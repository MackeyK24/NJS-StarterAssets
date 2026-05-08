import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";
import { SceneManager, ScriptComponent, LocalMessageBus } from "@babylonjs-toolkit/next";

export class DefaultGameMode extends ScriptComponent {
    public message: string = "Hello Babylon Toolkit";

    protected start(): void {
        console.log(this.message);
    }
}
