import * as anu from '@jpmorganchase/anu';
import * as BABYLON from '@babylonjs/core';
import * as d3 from 'd3';
import { XYZ } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import paperData from '../data/paperData.json' assert { type: 'json' };  //Our data
import affiliationList from '../data/affiliationList.json' assert { type: 'json' }; //Location Key

export const affiliationsChart = async (scene) => {

  //Use the Texture Map prefab to create a plane with an OpenLayers map canvas as the texture
  let textureMap = anu.createTextureMap('affiliations-map',
    {
      //We can set a custom tile provider by modifying the layers
      layers: [
        new TileLayer({
          source: new XYZ({ crossOrigin: 'anonymous', urls: ['https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']})
        })
      ],
      meshSize: 10,
      mapHeight: 2000,
      mapWidth: 3000
    }
  );

  //We can access the OpenLayers map objects to change settings like Zoom level
  let openLayersMap = textureMap.map;
  // openLayersMap.getView().setCenter([0,20]);
  // openLayersMap.getView().setZoom(3);

  //Turn on keyboard controls on the TextureMap prefab (uses WASD and -+)
  textureMap.keyboardControls(scene);


  //The Texture Map prefab generates scale functions for us to convert lon/lat to positions in Babylon's coordinate space
  let scaleLon = textureMap.scaleLon;
  let scaleLat = textureMap.scaleLat;
  //Create another D3 scale for color
  let scaleC = d3.scaleOrdinal(anu.ordinalChromatic('d310').toColor4(52));

  //Select our map object as a Selection object which will serve as our CoT
  let chart = anu.selectName('affiliations-map', scene)
                  .position(new BABYLON.Vector3(0, 0, -10));


  //We need to transform our data to:
  //1) Get the lat/lon coordinates of each affiliation
  //2) Derive the total count of publications from each affiliation
  let dataTransformed = affiliationList.map(d => {
    let count = 0;
    paperData.forEach(paper => {
      if (paper.AuthorAffiliation?.includes(d.Name))
        count++;
    });

    return {
      ...d,
      'Latitude': parseFloat(d.Position.split(',')[0]),
      'Longitude': parseFloat(d.Position.split(',')[1]),
      'Count': count
    }
  })

  //Drop all affiliations that have invalid lat/lon
  dataTransformed = dataTransformed.filter(d => !isNaN(d.Latitude) && !isNaN(d.Longitude));

  let scaleY = d3.scaleLinear().domain([0, d3.max(dataTransformed, d => d.Count)]).range([0, 5]);

  //We will use Mesh instancing to improve performance of our scatter plot dots
  //First we create a root Mesh will be instanced off of
  let rootBox = anu.create('box', 'root-box', { size: 1 });
  rootBox.isVisible = false;
  rootBox.registerInstancedBuffer('color', 4);

  //Then we bind instances from this root Mesh to create our bars
  let bars = chart.bindInstance(rootBox, dataTransformed)
                  .setInstancedBuffer('color', new BABYLON.Color4(0, 0, 0, 1));

  openLayersMap.on('rendercomplete', () => {
    //Update the bars
    bars.positionX((d) => scaleLon([d.Longitude, d.Latitude]))
      .positionZ((d) => scaleLat([d.Longitude, d.Latitude]))
      .scaling((d) => new BABYLON.Vector3(0.05, scaleY(d.Count), 0.05))
      .positionY((d) => scaleY(d.Count) / 2)
      .setInstancedBuffer('color', (d) => scaleC(d.Name))
      .prop('isVisible', (d, n, i) => {
        const parentBoundingBox = textureMap.mesh.getBoundingInfo().boundingBox;
        return !(n.position.x > parentBoundingBox.maximum.x ||
          n.position.x < parentBoundingBox.minimum.x ||
          n.position.z > parentBoundingBox.maximum.z ||
          n.position.z < parentBoundingBox.minimum.z);
      });
  });

  return scene;
}