import * as anu from '@jpmorganchase/anu';
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import * as d3 from 'd3';
import * as d3force from 'd3-force-3d';
import authorGraph from '../data/authorGraph.json' assert {type: 'json'};  //Our data

export const authorsNetwork = async (scene) => {

  //Create a deep clone of our data, as the simulation  mutates it
  //let data = JSON.parse(JSON.stringify(authorGraph));

  //Create our D3 force simulation; this will populate the data with some positional values
  //   let simulation = d3force.forceSimulation(data.nodes, 3)
  //                           .force('link', d3force.forceLink(data.links).id(d => d.id))
  //                           .force('charge', d3force.forceManyBody())
  //                           .force('collide', d3force.forceCollide())
  //                           .force('center', d3force.forceCenter(0, 0, 0))
  //                           .on('tick', ticked)
  //                           .on('end', () => simulation.stop())

  //Create scales that will map data to visual variables
  //Positional encodings will be set by the force simulation
  //   let scaleC = d3.scaleOrdinal(anu.ordinalChromatic('d310').toColor4());  //Affiliation
  //   let scaleSize = d3.scaleLinear().domain([1, d3.max(data.nodes.map(d => d.paperIndex.length))]).range([0.5, 2]); //Number of publications

  //Create a Center of Transform that will be the parent node of our network
  let network = undefined;

  //We will use Mesh instancing to improve performance of our network nodes
  //First we create a root Mesh will be instanced off of
  let rootNode = undefined;

  //Then we bind instances from this root Mesh to create our network nodes
  let nodes = undefined;

  //Create a helper function to map simulation data to a data structure needed for our lineSystem
  //   function dataToLinkPositions(data) {
  //     let lines = [];
  //     data.forEach((v, i) => {
  //         let start = new BABYLON.Vector3(v.source.x, v.source.y, v.source.z);
  //         let end = new BABYLON.Vector3(v.target.x, v.target.y, v.target.z);
  //         lines.push([start, end]);
  //     })
  //     return lines;
  //   }

  //Create our lineSystem mesh using our data and helper function from above
  let links = undefined;


  //Create the callback that will run every simulation tick to update our node and links
  function ticked() {
    //For the instanced spheres, just set a new position based on values populated by the simulation
    //nodes.position();
    //For the links, use the run method to replace the lineSystem mesh with a new one, passing in the mesh into the instance option
    //links.run();
  }

  //The network can get quite big in size (spatial size), so here we run a function to scale the entire network down to a 1x1x1 box
  //network.run((d,n,i) => n.normalizeToUnitCube());


  //--------------------------------------------

  //Create a plane Mesh that will serve as our tooltip
  const hoverPlane = anu.create('plane', 'authors-network-tooltip', { width: 1, height: 1 });
  hoverPlane.isPickable = false;    //Disable picking so it doesn't get in the way of interactions
  hoverPlane.renderingGroupId = 1;  //Set render id higher so it always renders in front of other objects
  hoverPlane.isVisible = false;     //Hide the tooltip
  hoverPlane.billboardMode = 7;     //Set the tooltip to always face the camera

  //Add an AdvancedDynamicTexture to this plane Mesh which will let us render Babylon GUI elements on it
  let advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(hoverPlane);

  //Create and customize the rectangle for the background
  let UIBackground = new GUI.Rectangle();
  UIBackground.adaptWidthToChildren = true;
  UIBackground.adaptHeightToChildren = true;
  UIBackground.cornerRadius = 20;
  UIBackground.color = 'Black';
  UIBackground.thickness = 2;
  UIBackground.background = 'White';
  advancedTexture.addControl(UIBackground);

  //Create and customize the text for our tooltip
  let label = new GUI.TextBlock();
  label.paddingLeftInPixels = 25;
  label.paddingRightInPixels = 25;
  label.fontSizeInPixels = 50;
  label.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  label.textWrapping = GUI.TextWrapping.WordWrap;
  label.resizeToFit = true;
  label.text = ' ';
  UIBackground.addControl(label);

  //Bind an action to show the tooltip
  //nodes.action();

  //Bind an action to hide the tooltip
  //nodes.action();

  //--------------------------------------------

  //Bind an action to highlight a picked node and its edges
  //nodes.action();

  //Bind an action to unhighlight the node
  //nodes.action();


  //--------------------------------------------

  //Bind an action to show the link
  //nodes.action();

  //Bind an action to reset the link
  //nodes.action();

  return scene;
}