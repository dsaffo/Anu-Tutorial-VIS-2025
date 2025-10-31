import * as anu from '@jpmorganchase/anu';
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import * as d3 from 'd3';
import * as d3force from 'd3-force-3d';
import authorGraph from '../data/authorGraph.json' assert {type: 'json'};  //Our data

export const authorsNetwork = async (scene) => {

  //Create a deep clone of our data, as the simulation  mutates it
  let data = JSON.parse(JSON.stringify(authorGraph));

  //Create our D3 simulation
  let simulation = d3force.forceSimulation(data.nodes, 3)
                          .force('link', d3force.forceLink(data.links).id(d => d.id))
                          .force('charge', d3force.forceManyBody())
                          .force('collide', d3force.forceCollide())
                          .force('center', d3force.forceCenter(0, 0, 0))
                          .on('tick', ticked)
                          .on('end', () => simulation.stop())

  //We use Mesh instancing here for better performance, first we create a Mesh that serves as the root Node
  let rootSphere = anu.create('sphere', 'node', { diameter: 25, segments: 4 });
  rootSphere.isVisible = false;
  rootSphere.hasVertexAlpha = true;
  rootSphere.registerInstancedBuffer('color', 4);

  //Create a Center of Transform that will be the parent node of our network
  let network = anu.bind('cot').name('authorsNetwork');

  network.position(new BABYLON.Vector3(10, 5, 4));

  //Create a D3 color scale of the 'schemecategory10' palette to map data to Color4 objects
  let scaleC = d3.scaleOrdinal(anu.ordinalChromatic('d310').toColor4());
  //Create a D3 scale to help size each node based on number of papers published by that autho
  let scaleSize = d3.scaleLinear().domain([1, d3.max(data.nodes.map(d => d.paperIndex.length))]).range([0.5, 2]);

  //Create our nodes, we will set their position in the simulation
  let nodes = network.bindInstance(rootSphere, data.nodes)
                      .setInstancedBuffer('color', (d) => scaleC(d.affiliation))
                      .scaling((d) => new BABYLON.Vector3(scaleSize(d.paperIndex.length), scaleSize(d.paperIndex.length), scaleSize(d.paperIndex.length)))
                      .id((d) => d.id);

  //Create a helper function that will return us an array of arrays where each sub-array is the start and end Vector3 of each link
  function dataToLinks(data) {
    let lines = [];
    data.forEach((v, i) => {
        let start = (new BABYLON.Vector3(v.source.x, v.source.y, v.source.z));
        let end = (new BABYLON.Vector3(v.target.x, v.target.y, v.target.z));
        lines.push([start, end]);
    })
    return lines;
  }

  //Create our lineSystem mesh using our data and helper function from above
  let links = network.bind('lineSystem', { lines: (d) => dataToLinks(d), updatable: true }, [data.links]);

  //Create the callback that will run every simulation tick to update our node and links
  function ticked() {
     //For the instanced spheres, just set a new position based on values populated by the simulation
    nodes.position((d) => (new BABYLON.Vector3(d.x, d.y, d.z)));
    //For the links, use the run method to replace the lineSystem mesh with a new one, passing in the mesh into the instance option
    links.run((d,n,i) => anu.create('lineSystem', 'edge', { lines: dataToLinks(d), instance: n, updatable: true }, d));
  }

  //The network can get quite big in size (spatial size), so here we run a function to scale the entire network down to a 1x1x1 box
  network.run((d,n,i) => n.normalizeToUnitCube());


  //--------------------------------------------

  //Create a plane Mesh that will serve as our tooltip
  const hoverPlane = anu.create('plane', 'hoverPlane', { width: 1, height: 1 });
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
  label.resizeToFit = true;
  label.text = ' ';
  UIBackground.addControl(label);

  //Bind actions to the nodes
  nodes.action((d, n, i) => new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnPointerOverTrigger,
      () => {
        label.text = `${d.id}\n${d.affiliation}\n${d.paperIndex.length} paper(s)`;
        hoverPlane.position = n.absolutePosition.add(new BABYLON.Vector3(0, 0.2, 0));
        hoverPlane.isVisible = true;
      }
    ))
    .action((d, n, i) => new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnPointerOutTrigger,
      () => {
        hoverPlane.isVisible = false;
      }
    ));

  //--------------------------------------------

  //Bind an action to highlight a picked node and its edges
  nodes.action((d, n, i) => new BABYLON.ExecuteCodeAction(
    BABYLON.ActionManager.OnPickDownTrigger,
    () => {
      //Get the list of co-authors connected to this one based on the edge list
      let coauthors = [d.id];
      for (const link of data.links) {
        if (link.source.id === d.id)
          coauthors.push(link.target.id);
        else if (link.target.id === d.id)
          coauthors.push(link.source.id);
      }

      //Update the opacity of all nodes
      nodes.setInstancedBuffer('color', (d) => {
        const color = scaleC(d.affiliation);
        return new BABYLON.Color4(color.r, color.g, color.b, (coauthors.includes(d.id)) ? 1 : 0.25);
      });
    }
  ));
  //Bind an action to unhighlight the node
  nodes.action((d, n, i) => new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnDoublePickTrigger,
      () => {
        //Reset the opacity of all nodes
        nodes.setInstancedBuffer('color', (d) => scaleC(d.affiliation));
      }
    ));


  return scene;
}