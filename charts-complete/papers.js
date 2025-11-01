// import * as anu from '@jpmorganchase/anu';
// import * as BABYLON from '@babylonjs/core';
// import * as GUI from '@babylonjs/gui';
// import * as d3 from 'd3';

// //Create a scatter plot of papers over the years
// export const papersChart = async (scene) => {

//     //Create scales that will map data to visual variables
//   let scaleX = d3.scaleSymlog().domain(d3.extent(paperData, d => d["Downloads_Xplore"])).range([0, 10]).constant(5000).nice();   //Downloads
//   let scaleY = d3.scaleSymlog().domain(d3.extent(paperData, d => d["AminerCitationCount"])).range([0, 5]).constant(100).nice();  //Citations
//   // let scaleZ = d3.scaleBand().domain(paperData.map(d => d.Year)).range([0, 10]).padding(0.1);  //Year
//   let scaleC = d3.scaleOrdinal().domain(["", "HM", "BP", "TT", "TT;HM", "TT;BP"]).range(anu.ordinalChromatic(['#FFFFFF', '#1b9e77', '#d95f02', '#7570b3', '#FFD700', '#FFD700']).toColor4()); //Awards

//   //Create a Center of Transform that will hold our scatterplot
//   let chart = anu.bind('cot')
//                   .name('papers-scatter-plot')
//                   .position(new BABYLON.Vector3(-10, 0, 0));

//   //We will use Mesh instancing to improve performance of our scatter plot dots
//   //First we create a root Mesh will be instanced off of
//   let rootDot = anu.create('box', 'root-node', { size: 0.1 });
//   rootDot.isVisible = false;
//   rootDot.registerInstancedBuffer('color', 4);

//   //Then we bind instances from this root Mesh to create our scatter plot dots
//   let dots = chart.bindInstance(rootDot, paperData)
//                   .name('scatter-dots')
//                   .position((d) => new BABYLON.Vector3(scaleX(d["Downloads_Xplore"]), scaleY(d["AminerCitationCount"]), scaleZ(d.Year)))  //Set visual variables using our D3 scales
//                   .setInstancedBuffer('color', (d) => scaleC(d.Award));

//   //Create a config object to modify the default axis settings
//   let axesConfig = new anu.AxesConfig({ x: scaleX, y: scaleY, z: scaleZ });
//   axesConfig.parent = chart;
//   axesConfig.grid = false;
//   axesConfig.domainMaterialOptions = { width: 0.01 };
//   axesConfig.labelOptions = {
//     x: { align: 'end', size: 0.3 },
//     y: { size: 0.2 },
//     z: { align: 'end', size: 0.4 }
//   }
//   axesConfig.labelProperties = {
//     x: { rotation: new BABYLON.Vector3(0, 0, -Math.PI * 0.25) },
//     z: { rotation: new BABYLON.Vector3(0, -Math.PI * 0.5, -Math.PI * 0.25) }
//   };
//   //Create the axis using our config
//   let axes = anu.createAxes("papers-scatter-plot-axes", axesConfig);

//   //--------------------------------------------

//   //Create a plane Mesh that will serve as our tooltip
//   const hoverPlane = anu.create('plane', 'papers-scatter-plot-tooltip', { width: 1, height: 1 });
//   hoverPlane.isPickable = false;    //Disable picking so it doesn't get in the way of interactions
//   hoverPlane.renderingGroupId = 1;  //Set render id higher so it always renders in front of other objects
//   hoverPlane.isVisible = false;     //Hide the tooltip
//   hoverPlane.billboardMode = 7;     //Set the tooltip to always face the camera

//   //Add an AdvancedDynamicTexture to this plane Mesh which will let us render Babylon GUI elements on it
//   let advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(hoverPlane);

//   //Create and customize the rectangle for the background
//   let UIBackground = new GUI.Rectangle();
//   UIBackground.adaptWidthToChildren = true;
//   UIBackground.adaptHeightToChildren = true;
//   UIBackground.cornerRadius = 20;
//   UIBackground.color = 'Black';
//   UIBackground.thickness = 2;
//   UIBackground.background = 'White';
//   advancedTexture.addControl(UIBackground);

//   //Create and customize the text for our tooltip
//   let label = new GUI.TextBlock();
//   label.paddingLeftInPixels = 25;
//   label.paddingRightInPixels = 25;
//   label.fontSizeInPixels = 50;
//   label.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
//   label.textWrapping = GUI.TextWrapping.WordWrap;
//   label.resizeToFit = true;
//   label.text = ' ';
//   UIBackground.addControl(label);

//   //Bind an action to show the tooltip
//   dots.action((d, n, i) => new BABYLON.ExecuteCodeAction(
//     BABYLON.ActionManager.OnPointerOverTrigger,
//     () => {
//       //Update the label text and place it above the dot
//       label.text = `
//       ${d.Title}
//       ${d['AuthorNames_Deduped'].split(';').join(', ')}
//       ${d.Year}
//       Citations: ${d['AminerCitationCount']?.toLocaleString('en-US')}
//       Downloads: ${d['Downloads_Xplore']?.toLocaleString('en-US')}
//       `;
//       hoverPlane.position = n.absolutePosition.add(new BABYLON.Vector3(0, 0.2, 0));
//       hoverPlane.isVisible = true;
//     }
//   ));

//   //Bind an action to hide the tooltip
//   dots.action((d, n, i) => new BABYLON.ExecuteCodeAction(
//     BABYLON.ActionManager.OnPointerOutTrigger,
//     () => {
//       //Hide the label
//       hoverPlane.isVisible = false;
//     }
//   ));

//   return scene;
// }