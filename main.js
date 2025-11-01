
import "@babylonjs/inspector";
import * as BABYLON from '@babylonjs/core';
import * as anu from '@jpmorganchase/anu';
import { papersChart } from "./charts/papers";
import { authorsNetwork } from "./charts/authors";
import { affiliationsChart } from "./charts/affiliations";

//Grab DOM element where we will attach our canvas. #app is the id assigned to an empty <div> in our index.html
const app = document.querySelector('#app');
//Create a canvas element and append it to #app div
const canvas = document.createElement('canvas');
app.appendChild(canvas);

//Initialize Babylon engine on the canvas we just created
const babylonEngine = new BABYLON.Engine(canvas, true)

//Create a scene for our engine
const scene = new BABYLON.Scene(babylonEngine);
scene.clearColor = BABYLON.Color3.Black();

//Add lights and a camera
new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 10, 0), scene)
const camera = new BABYLON.ArcRotateCamera("Camera", -(Math.PI / 4) * 3, Math.PI / 4, 10, new BABYLON.Vector3(0, 0, 0), scene);
camera.position = new BABYLON.Vector3(-10, 10, -20)
camera.lowerRadiusLimit = 0.1;
camera.attachControl(true)

//Run scripts that will create visualizations in our scene we created and pass in
await papersChart(scene);
await authorsNetwork(scene);
await affiliationsChart(scene);

//Render the scene every frame
babylonEngine.runRenderLoop(() => {
  scene.render()
})

//Listen for window size changes and resize the scene accordingly
window.addEventListener("resize", function () {
  babylonEngine.resize();
});

// Add a hotkey to hide/show the Inspector
window.addEventListener("keydown", (ev) => {
    // Shift+i
    if (ev.key === "I") {
        if (scene.debugLayer.isVisible()) {
            scene.debugLayer.hide();
        } else {
            scene.debugLayer.show();
        }
    }
});

//Enable WebXR through Babylon and enable some features like multi-view layers and space warp for better performance on supported devices/browsers.
//If your browser does not support these features, comment them out
try {
  var defaultXRExperience = await scene.createDefaultXRExperienceAsync({});
  // const featureManager = defaultXRExperience.baseExperience.featuresManager;
  // featuresManager.enableFeature(WebXRFeatureName.LAYERS, "latest", { preferMultiviewOnInit: true }, true, false);
  // featuresManager.enableFeature(WebXRFeatureName.SPACE_WARP, "latest");
} catch {
  console.warn('XR Not Supported');
}
