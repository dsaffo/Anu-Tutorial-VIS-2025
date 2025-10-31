import * as anu from '@jpmorganchase/anu';
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import * as d3 from 'd3';
import * as d3force from 'd3-force-3d';
import authorsGraph from '../data/authorGraph.json' assert {type: 'json'};  //Our data

export const authorsNetwork = async (scene) => {

  //Create a deep clone of our data, as the simulation  mutates it
  let data = JSON.parse(JSON.stringify(authorsGraph));

  //Create our D3 simulation
  let simulation = d3force.forceSimulation(data.nodes, 3)
                          .force('link', d3force.forceLink(data.links).id(d => d.id))
                          .force('charge', d3force.forceManyBody())
                          .force('collide', d3force.forceCollide())
                          .force('center', d3force.forceCenter(0, 0, 0))
                          .on('tick', ticked)
                          .on('end', () => simulation.stop());

  //We use Mesh instancing here for better performance, first we create a Mesh that serves as the root Node
  let rootSphere = anu.create('sphere', 'node', { diameter: 10, segments: 8 });
  rootSphere.isVisible = false;
  rootSphere.registerInstancedBuffer('color', 4);

  //Create a Center of Transform that will be the parent node of our network
  let network = anu.bind('cot');

  //Create a D3 color scale of the 'schemecategory10' palette to map data to Color4 objects
  let scaleC = d3.scaleOrdinal(anu.ordinalChromatic('d310').toColor4());

  //Create our nodes, we will set their position in the simulation
  let nodes = network.bindInstance(rootSphere, data.nodes)
                      .setInstancedBuffer('color', (d) => scaleC(d.affiliation))
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

  return scene;
}