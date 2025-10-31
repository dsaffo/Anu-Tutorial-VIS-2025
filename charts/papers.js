import * as anu from '@jpmorganchase/anu';
import * as BABYLON from '@babylonjs/core';
import * as d3 from 'd3';
import data from '../data/paperData.json' assert {type: 'json'};  //Our data

//Create a scatter plot of papers over the years
export const papersChart = async (scene) => { 

    //let scaleX = d3.scaleBand().domain(data.map(d => d.Year)).range([0, 10]).padding(0.1);
    let scaleX = d3.scaleSymlog().domain(d3.extent(data, d => d["Downloads_Xplore"])).range([0, 10]).constant(5000).nice();
    let scaleY = d3.scaleSymlog().domain(d3.extent(data, d => d["AminerCitationCount"])).range([0, 5]).constant(100).nice();
    let scaleZ = d3.scaleBand().domain(data.map(d => d.Year)).range([0, 10]).padding(0.1);


    let scaleC = d3.scaleOrdinal(anu.ordinalChromatic('d310').toColor4())
    
    let chart = anu.bind('cot')
                    .name('ScatterPlot')
                    .position(new BABYLON.Vector3(-10, 0, 0))

    //We use Mesh instancing here for better performance, first we create a Mesh that serves as the root Node
    let rootDisc = anu.create('box', 'disc', { size: 0.1 });
    rootDisc.isVisible = false;
    rootDisc.registerInstancedBuffer('color', 4);

    let dots = chart.bindInstance(rootDisc, data)
                    .name('scatter-discs')
                    .position(d => new BABYLON.Vector3(scaleX(d["Downloads_Xplore"]), scaleY(d["AminerCitationCount"]), scaleZ(d.Year)))
                    .setInstancedBuffer('color', (d) => scaleC(d.Award))

    let axesConfig = new anu.AxesConfig({x: scaleX, y: scaleY, z: scaleZ});

    axesConfig.parent = chart;
    axesConfig.grid = false;
    axesConfig.domainMaterialOptions = {width: 0.01}
    axesConfig.labelOptions = {x: {align: 'end', size: 0.3}, z: {align: 'end', size: 0.4}, y: {size: 0.2}}
    axesConfig.labelProperties = {x: {rotation: new BABYLON.Vector3(0, 0, -Math.PI * 0.25)}, 
    z: {rotation: new BABYLON.Vector3(0, -Math.PI * 0.5, -Math.PI * 0.25)}};


    let axes = anu.createAxes("scatterplotAxes", axesConfig);

    return scene;
}