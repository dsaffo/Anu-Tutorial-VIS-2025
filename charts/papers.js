import * as anu from '@jpmorganchase/anu';
import * as BABYLON from '@babylonjs/core';
import * as d3 from 'd3';
import data from '../data/paperData.json' assert {type: 'json'};  //Our data

//Create a scatter plot of papers over the years
export const papersChart = async (scene) => {

  //Create D3 scales
  let scaleX = d3.scaleLinear().domain([0, d3.max(data, d => d["Downloads_Xplore"])]).range([0, 10]).nice();
  let scaleY = d3.scaleLinear().domain([0, d3.max(data, d => d["AminerCitationCount"])]).range([0, 5]).nice();
  let scaleC = d3.scaleOrdinal().domain(["", "HM", "BP", "TT", "TT;HM", "TT;BP"]).range(anu.ordinalChromatic(['#FFFFFF', '#1b9e77', '#d95f02', '#7570b3', '#FFD700', '#FFD700']).toStandardMaterial());

  //Create a Center of Transform that will be the parent node of our scatter plot
  let chart = anu.bind('cot')
                  .name('ScatterPlot')
                  .position(new BABYLON.Vector3(-15, 0, 0))

  //Create the dots for the scatterplot
  let dots = chart.bind('disc', { radius: 0.05, tesselation: 6 }, data)
                  .name('scatter-discs')
                  .position(d => new BABYLON.Vector3(scaleX(d["Downloads_Xplore"]), scaleY(d["AminerCitationCount"]), 0.001))
                  .material(d => scaleC(d["Award"]))

  //Create the config to customize our axes
  let axesConfig = new anu.AxesConfig({ x: scaleX, y: scaleY });
  axesConfig.parent = chart;
  axesConfig.grid = false;
  axesConfig.domainMaterialOptions = { width: 0.01 };
  //Create the axes using the config
  let axes = anu.createAxes("scatterplotAxes", axesConfig);

  return scene;
}