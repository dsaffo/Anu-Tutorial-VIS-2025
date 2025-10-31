import * as anu from '@jpmorganchase/anu';
import * as BABYLON from '@babylonjs/core';
import * as d3 from 'd3';
import data from '../data/paperData.json' assert {type: 'json'};  //Our data
import {affiliations} from '../data/affiliationList' //Location Key

export const affiliationsChart = async (scene) => {

    
  //Use the Texture Map prefab to create a plane with an OpenLayers map canvas as the texture
  let textureMap = anu.createTextureMap('map', { meshSize: 10, mapHeight: 2000, mapWidth: 3000 });

  //Get the OpenLayers map object from the prefab which we will need to customize its settings
  let map = textureMap.map;
  //Change the view parameters of the map to focus on the US
  map.getView().setCenter([0,20]);
  map.getView().setZoom(3);

  //Turn on keyboard controls on the TextureMap prefab (uses WASD and -+)
  //Due to a technical quirk, this function must be called *after* setting the center and zoom of the view
  textureMap.keyboardControls(scene);


  //To help create our dots, the Texture Map prefab generates scale functions for us to convert lon/lat to positions in Babylon's coordinate space
  let scaleLon = textureMap.scaleLon;
  let scaleLat = textureMap.scaleLat;
  //Create a D3 scale for color, using Anu helper functions map scale outputs to Color4 objects based on the 'schemecategory10' palette from D3
  let scaleC = d3.scaleOrdinal(anu.ordinalChromatic('d310').toColor4(52));


  //Select our map object as a Selection object which will serve as our CoT
  let chart = anu.selectName('map', scene);

  chart.position(new BABYLON.Vector3(0, 0, -10));

  // 1) Build an index of affiliation coordinates from the affiliation list
  //    Position is provided as "lat,lon" string; we convert to numbers and store as {latitude, longitude}
  const affRecords = affiliations
    .map(a => {
      const pos = (a.Position || '').trim();
      const parts = pos ? pos.split(',').map(Number) : [];
      const latitude = parts.length === 2 && Number.isFinite(parts[0]) ? parts[0] : null;
      const longitude = parts.length === 2 && Number.isFinite(parts[1]) ? parts[1] : null;
      return {
        name: (a.Name || '').trim(),
        nameLower: (a.Name || '').trim().toLowerCase(),
        simple: (a.NameSimple || '').trim(),
        simpleLower: (a.NameSimple || '').trim().toLowerCase(),
        latitude,
        longitude
      };
    });

  // Helper: normalize an affiliation string from paper data
  const normalizeAff = (s) => (s || '').replace(/[()]/g, '').trim();
  const baseAff = (s) => normalizeAff(s).split(';')[0].split('|')[0].split('/')[0].trim();

  // Helper: resolve a paper affiliation string to a record in affRecords (best-effort fuzzy match)
  const resolveAffiliation = (affRaw) => {
    const aff = baseAff(affRaw);
    if (!aff) return null;
    const affLower = aff.toLowerCase();

    // 1) exact match on full name
    let best = affRecords.find(r => r.nameLower === affLower);
    if (best) return best;

    // 2) try prefix before first comma (often trims country/department)
    const prefix = affLower.split(',')[0].trim();
    best = affRecords.find(r => r.nameLower === prefix);
    if (best) return best;

    // 3) includes checks: prefer the longest matching record name
    let candidate = null;
    for (const r of affRecords) {
      if (!r.nameLower) continue;
      if (affLower.includes(r.nameLower) || r.nameLower.includes(affLower) || (prefix && r.nameLower.includes(prefix))) {
        if (!candidate || r.nameLower.length > candidate.nameLower.length) candidate = r;
      }
    }
    return candidate || null;
  };

  // 2) Aggregate publications by resolved affiliation name
  // First roll up counts by raw AuthorAffiliation string
  const countsByRaw = d3.rollup(data, v => v.length, d => d["AuthorAffiliation"] || "Unknown");

  // Then resolve each raw string to a canonical name (from affiliation list when possible),
  // and merge counts for the same canonical name
  const aggByName = new Map();
  for (const [affRaw, count] of countsByRaw) {
    const match = resolveAffiliation(affRaw);
    const nameKey = match ? match.name : baseAff(affRaw) || 'Unknown';
    const prev = aggByName.get(nameKey) || { name: nameKey, count: 0, latitude: match?.latitude ?? null, longitude: match?.longitude ?? null };
    prev.count += count;
    // If we didn't have coords yet and this match has them, keep them
    if ((prev.latitude == null || prev.longitude == null) && match && match.latitude != null && match.longitude != null) {
      prev.latitude = match.latitude;
      prev.longitude = match.longitude;
    }
    aggByName.set(nameKey, prev);
  }

  // Create a flat array for binding to instances
  const aggregated = Array.from(aggByName.values()).map(d => ({
    name: d.name,
    count: d.count,
    latitude: d.latitude,
    longitude: d.longitude,
    hasCoords: Number.isFinite(d.latitude) && Number.isFinite(d.longitude)
  }));

  // Height scale for counts (sphere height above map)
  const scaleY = d3.scaleLinear()
    .domain([0, d3.max(aggregated, d => d.count) || 1])
    .range([0, 10]);

    //We use Mesh instancing here for better performance, first we create a Mesh that serves as the root Node
    let rootBox = anu.create('box', 'mapBox', { size: 1 });
    rootBox.isVisible = false;
    rootBox.registerInstancedBuffer('color', 4);   //We need an InstancedBuffer to set the color of instances


  // Bind aggregated data to instances
  let bars = chart.bindInstance(rootBox, aggregated)
    .setInstancedBuffer('color', new BABYLON.Color4(0, 0, 0, 1));

  //We want to position our spheres whenever the map is loaded and updated (i.e., panned or zoomed), use OpenLayers' callback functions for this
  //N.B: Texture Map's scale functions are only created after the map is fully rendered, so we need to use this callback regardless
  // Precompute a fallback layout along the right edge for affiliations without coordinates
  const missingItems = aggregated.filter(d => !d.hasCoords);
  const fallbackPos = new Map(); // name -> {x, z}

  map.on('rendercomplete', () => {
    // Lazily compute fallback positions once we have the map mesh bounds
    if (fallbackPos.size === 0 && missingItems.length > 0) {
      const bbox = textureMap.mesh.getBoundingInfo().boundingBox;
      const margin = 0.02; // keep inside bounds so they remain visible
      const x = bbox.maximum.x - margin; // right edge, inside
      const zScale = d3.scaleLinear()
        .domain([0, Math.max(1, missingItems.length - 1)])
        .range([bbox.minimum.z + margin, bbox.maximum.z - margin]);
      missingItems.forEach((d, i) => {
        fallbackPos.set(d.name, { x, z: zScale(i) });
      });
    }

    // Position spheres: use lon/lat when available; otherwise fallback positions
    bars
      .positionX((d) => d.hasCoords ? scaleLon([d.longitude, d.latitude]) : (fallbackPos.get(d.name)?.x ?? 0))
      .positionZ((d) => d.hasCoords ? scaleLat([d.longitude, d.latitude]) : (fallbackPos.get(d.name)?.z ?? 0))
      .scaling((d) => new BABYLON.Vector3(0.05, scaleY(d.count), 0.05))
      .positionY((d) => scaleY(d.count)/ 2)
      .setInstancedBuffer('color', (d) => BABYLON.Color3.Random())
      .prop('isVisible', (d, n) => {  // show only when within the map plane bounds (fallbacks are placed inside bounds)
        const parentBoundingBox = textureMap.mesh.getBoundingInfo().boundingBox;
        return !(n.position.x > parentBoundingBox.maximum.x ||
                 n.position.x < parentBoundingBox.minimum.x ||
                 n.position.z > parentBoundingBox.maximum.z ||
                 n.position.z < parentBoundingBox.minimum.z);
      });
  });
    
    return scene;
}