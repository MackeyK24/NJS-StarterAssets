# Using Exported Unity Content

![Unity Starter Assets](./Screenshot.png)


## Babylon Toolkit Extension

A universal runtime library for advanced BabylonJS game development.

https://github.com/BabylonJS/BabylonToolkit


## Unity Asset Store

The Starter Assets are free and light-weight first and third person character base controllers for the latest Unity 2023 LTS Or Greater

https://assetstore.unity.com/packages/essentials/starter-assets-character-controllers-urp-267961


## Default Installation (NEXT.JS)
```bash
npm install
npm run dev
```

* Default Module Import Libraries
```javascript
import { Engine, Scene } from "@babylonjs/core";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";
import { SceneManager, ScriptComponent } from "@babylonjs-toolkit/next";
```

* Granular File Level Import Libraries
```javascript
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";
import { SceneManager } from "@babylonjs-toolkit/next/scenemanager";
import { ScriptComponent } from "@babylonjs-toolkit/next/scenemanager";
import { LocalMessageBus } from "@babylonjs-toolkit/next/localmessagebus";
import { CharacterController } from "@babylonjs-toolkit/next/charactercontroller";
```

* Legacy Global Namespace Import Libraries
```javascript
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";
import * as TOOLKIT from "@babylonjs-toolkit/next";
TOOLKIT.SceneManager.AutoStripNamespacePrefix = false;
```

# 🌳 Tree Shaking 

The Babylon Toolkit ES6 library is optimized for maximum tree-shaking with **39 separate module files** containing **114 total declarations**. The build system intelligently groups related classes to handle circular dependencies while maintaining optimal bundle sizes.

### Key Benefits:
- ✅ **Smart dependency grouping** - Related classes are bundled together
- ✅ **Zero unused code** - Only imported classes are included
- ✅ **Circular dependency handling** - Complex relationships are managed automatically
- ✅ **Multiple import styles** - Choose the approach that fits your needs

## 🚀 Import Methods

### Method 1: Main Index Import (Recommended)
```typescript
import { SceneManager, ScriptComponent, InputController } from "@babylonjs-toolkit/next";
```
- **Pros**: Simple, clean, easy to refactor
- **Cons**: Bundler must analyze index.js
- **Use Case**: Most applications, rapid development

### Method 2: File-Level Import (Maximum Control)
```typescript
import { SceneManager } from "@babylonjs-toolkit/next/scenemanager";
import { LocalMessageBus } from "@babylonjs-toolkit/next/localmessagebus";
```
- **Pros**: Explicit dependencies, maximum bundler hints
- **Cons**: More verbose, requires knowledge of file structure
- **Use Case**: Library authors, performance-critical applications

## 🎯 Best Practices

### 1. Start Small
Begin with minimal imports and add components as needed:
```typescript
// Start with this
import { SceneManager } from "@babylonjs-toolkit/next";

// Add components incrementally
import { SceneManager, InputController } from "@babylonjs-toolkit/next";
```

### 2. Group Related Imports
Import related functionality together:
```typescript
// Good - related physics components
import { 
    CharacterController, 
    RigidbodyPhysics, 
    CollisionState 
} from "@babylonjs-toolkit/next";
```

### 3. Use File-Level Imports For Maximum Control
When bundle size is critical:
```typescript
// Maximum tree-shaking for production
import { SceneManager } from "@babylonjs-toolkit/next/scenemanager";

// Character Controllers
import { CharacterController } from "@babylonjs-toolkit/next/scenemanager";
import { SimpleCharacterController } from "@babylonjs-toolkit/next/scenemanager";
import { RecastCharacterController } from "@babylonjs-toolkit/next/scenemanager";

// Animation & Media Components
import { ShurikenParticles } from "@babylonjs-toolkit/next/shurikenparticles";
import { WebVideoPlayer } from "@babylonjs-toolkit/next/webvideoplayer";

// Terrain & Environment
import { TerrainGenerator } from "@babylonjs-toolkit/next/terraingenerator";
import { UniversalTerrainMaterial } from "@babylonjs-toolkit/next/universalterrainmaterial";

// Material Systems
import { CustomShaderMaterial } from "@babylonjs-toolkit/next/customshadermaterial";
import { CustomShaderMaterialPlugin } from "@babylonjs-toolkit/next/customshadermaterialplugin";

// Utility Classes
import { CustomLoadingScreen } from "@babylonjs-toolkit/next/customloadingscreen";
import { PrefabObjectPool } from "@babylonjs-toolkit/next/prefabobjectpool";
import { LocalMessageBus } from "@babylonjs-toolkit/next/localmessagebus";
import { LinesMeshRenderer } from "@babylonjs-toolkit/next/linesmeshrenderer";

// Enums & Types (Smallest Imports)
import { Handedness } from "@babylonjs-toolkit/next/handedness";
import { PlayerControl } from "@babylonjs-toolkit/next/playercontrol";
import { MovementType } from "@babylonjs-toolkit/next/movementtype";
import { CollisionContact } from "@babylonjs-toolkit/next/collisioncontact";
import { BlendTreePosition } from "@babylonjs-toolkit/next/blendtreeposition";
```

### 4. Analyze Your Bundle
Use your bundler's analysis tools to verify tree-shaking:
```bash
# Vite bundle analysis
npm run build -- --mode production

# Webpack bundle analyzer
npm install --save-dev webpack-bundle-analyzer
```
