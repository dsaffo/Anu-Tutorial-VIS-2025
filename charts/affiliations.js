// import * as anu from '@jpmorganchase/anu';
// import * as BABYLON from '@babylonjs/core';
// import * as d3 from 'd3';
// import { XYZ } from 'ol/source';
// import TileLayer from 'ol/layer/Tile';
import { scale } from 'ol/size';

export const affiliationsChart = async (scene) => {

    //Use the Texture Map prefab to create a plane with an OpenLayers map canvas as the texture
    let textureMap = undefined;



    //The Texture Map prefab generates scale functions for us to convert lon/lat to positions in Babylon's coordinate space
    //   let scaleLon = textureMap.scaleLon;
    //   let scaleLat = textureMap.scaleLat;
    //Create another D3 scale for color
    //   let scaleC = d3.scaleOrdinal(anu.ordinalChromatic('d310').toColor4(52));

    //Select our map object as a Selection object which will serve as our CoT
    let chart = undefined;


    //We need to transform our data to:
    //1) Get the lat/lon coordinates of each affiliation
    //2) Derive the total count of publications from each affiliation
    //   let dataTransformed = affiliationList.map(d => {
    //     let count = 0;
    //     paperData.forEach(paper => {
    //       if (paper.AuthorAffiliation?.includes(d.Name))
    //         count++;
    //     });

    //     return {
    //       ...d,
    //       'Latitude': parseFloat(d.Position.split(',')[0]),
    //       'Longitude': parseFloat(d.Position.split(',')[1]),
    //       'Count': count
    //     }
    //   })

    //Drop all affiliations that have invalid lat/lon
    //dataTransformed = dataTransformed.filter(d => !isNaN(d.Latitude) && !isNaN(d.Longitude));

    //Create a D3 scale for our y-axis
    //let scaleY = d3.scaleLinear().domain([0, d3.max(dataTransformed, d => d.Count)]).range([0, 5]); //Count of papers

    //We will use Mesh instancing to improve performance of our scatter plot dots
    //First we create a root Mesh will be instanced off of
    let rootBox = undefined;

    //Then we bind instances from this root Mesh to create our bars
    let bars = undefined;

    //We can also add text labels to each bar, binding from bar will inherit bound data and transforms
    let labels = undefined;

    //We only want to update the bars and labels once the map has finished loading
    const updateBars = undefined;


    return scene;
}