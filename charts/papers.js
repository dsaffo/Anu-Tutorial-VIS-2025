import * as anu from '@jpmorganchase/anu';
import * as BABYLON from '@babylonjs/core';
import * as d3 from 'd3';
import data from '../data/paperData.json' assert {type: 'json'};  //Our data

//Create a scatter plot of papers over the years
export const papersChart = async (scene) => { 

    let scaleX = d3.scaleBand().domain(data.map(d => d.Year)).range([0, 10]).padding(0.1);

    let scaleY = d3.scaleLinear().domain([0, d3.max(data, d => d["AminerCitationCount_02-2019"] + d["XPloreCitationCount_02-2019"] )]).range([0, 5]).nice();

    let scaleC = d3.scaleOrdinal(anu.ordinalChromatic('d310').toStandardMaterial())
    
    let chart = anu.bind('cot')
                    .name('ScatterPlot')
                    .position(new BABYLON.Vector3(-10, 0, 0))

    let dots = chart.bind('disc', {radius: 0.05, tesselation: 6}, data)
                    .name('scatter-discs')
                    .position(d => new BABYLON.Vector3(scaleX(d.Year), scaleY(d["AminerCitationCount_02-2019"] + d["XPloreCitationCount_02-2019"]), 0.001))
                    .material(d => scaleC(d.Conference))

    let axesConfig = new anu.AxesConfig({x: scaleX, y: scaleY});

    axesConfig.parent = chart;
    axesConfig.grid = false;
    axesConfig.domainMaterialOptions = {width: 0.01}

    let axes = anu.createAxes("scatterplotAxes", axesConfig);

    return scene;
}