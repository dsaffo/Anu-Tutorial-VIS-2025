
import "@babylonjs/inspector";
import * as BABYLON from '@babylonjs/core';
import * as anu from '@jpmorganchase/anu';
import { papersChart } from "./charts/papers";
import { authorsNetwork } from "./charts/authors";
import { affiliationsChart } from "./charts/affiliations";
import paperData from './data/paperData.json' assert {type: 'json'};  //Our data
import affiliationList from './data/affiliationList.json' assert { type: 'json' }; //Location Key

window.paperData = paperData;
window.affiliationList = affiliationList;

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

let box = anu.create('box');

//Run scripts that will create visualizations in our scene we created and pass in
await papersChart(scene);
await authorsNetwork(scene);
await affiliationsChart(scene);

//Render the scene every frame
babylonEngine.runRenderLoop(() => {
  scene.render()
});


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
  
      defaultXRExperience.baseExperience.onStateChangedObservable.add((state) => {
        if (state === WebXRState.ENTERING_XR) {
          xrSessionActive.value = true;
          
          // Position XR camera back 3 units on Z-axis after XR session is ready
          defaultXRExperience.baseExperience.sessionManager.onXRFrameObservable.addOnce(() => {
            const xrCamera = defaultXRExperience.baseExperience.camera;
            if (xrCamera) {
              // Simply move camera back 3 units on Z-axis
              xrCamera.position = new Vector3(0, 1, -5);
              console.log('XR Camera positioned at:', xrCamera.position);
            }
          });
          
          //Special exceptions for certain scenes
          switch (scene.metadata?.name) {
            case "thinInstances":
              console.log("Disabling GPU Picking interactions in WebXR due to lack of support.")
              scene.onPointerObservable.clear();
              break;
          }
        } else if (state === WebXRState.EXITING_XR || state === WebXRState.NOT_IN_XR) {
          xrSessionActive.value = false;
        }
      } );  
} catch {
  console.warn('XR Not Supported');
}
