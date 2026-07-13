// Storm-Driven Coastline Change Analysis of Santa Cruz, California

// load the GEE palette
var palettes = require('users/gena/packages:palettes');

// load GEOG487 library
var lib = require('users/xjtang/teaching:GEOG487/Library');

// Revised Preprocessing of S2
var Preprocess_S2_mod = function(img) {
  var qa = img.select('QA60');
  var cloud = ee.Image(img.get('cloud_prob')).select('probability');
  var cloudProbMask = cloud.lt(50); // relaxed the threshold from 35 to 50 to prevent holes in data.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0))
      .and(cloudProbMask);

  return img.select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12'])
            .rename(['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2'])
            .updateMask(mask);
};


// Center Map
Map.centerObject(SC_Coastline, 12);

// Import AOI's
Map.addLayer(SC_Coastline, {color: 'red'}, 'SC Coastline');
Map.addLayer(SC_Beach, {color: 'blue'}, 'SC Beach');
Map.addLayer(Pleasure_Point, {color: 'yellow'}, 'Pleasure Point');
Map.addLayer(SeaCliffBeach, {color: 'purple'}, 'Sea Cliff Beach');

// Date Windows
var preStart = '2022-11-01';
var preEnd = '2022-12-31';

var postStart = '2023-01-05';
var postEnd = '2023-02-28';

// Load Sentinel-2 Imagery
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(SC_Coastline)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60));

var S2_CloudProb = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY')
  .filterBounds(SC_Coastline);
  
// Join cloud probability to S2
var joined = ee.ImageCollection(
  ee.Join.saveFirst('cloud_prob').apply({
    primary: s2,
    secondary: S2_CloudProb,
    condition: ee.Filter.equals({
      leftField: 'system:index',
      rightField: 'system:index'
    })
  })
);

// Pre-Storm and Post-Storm Collections preprocessing
var preCollection = joined
  .filterDate(preStart, preEnd)
  .map(Preprocess_S2_mod);
  
var postCollection = joined
  .filterDate(postStart, postEnd)
  .map(Preprocess_S2_mod);

// Print image counts
print('Pre-Storm image count:', preCollection.size());
print('Post-Storm image count:', postCollection.size());

// Median temporal composites for both Pre-Storm and Post-Storm
var preComposite = preCollection.median().clip(SC_Coastline);
var postComposite = postCollection.median().clip(SC_Coastline);

// Visualization parameters for True Color Composites
var trueColorVis = {bands:['Red', 'Green', 'Blue'], min: 0, max: 3000};

// Add Pre-Storm and Post-Storm Composite to map
Map.addLayer(preComposite, trueColorVis, 'Pre-Storm Composite');
Map.addLayer(postComposite, trueColorVis, 'Post-Storm Composite');

// Add study area sections for beach to beach comparisons
Map.addLayer(preComposite.clip(SC_Beach), trueColorVis, 'SC Beach Pre', false);
Map.addLayer(postComposite.clip(SC_Beach), trueColorVis, 'SC Beach Post', false);

Map.addLayer(preComposite.clip(Pleasure_Point), trueColorVis, 'Pleasure Point Pre', false);
Map.addLayer(postComposite.clip(Pleasure_Point), trueColorVis, 'Pleasure Point Post', false);

Map.addLayer(preComposite.clip(SeaCliffBeach), trueColorVis, 'Sea Cliff Beach Pre', false);
Map.addLayer(postComposite.clip(SeaCliffBeach), trueColorVis, 'Sea Cliff Beach Post', false);

// Compute NDWI
var preNDWI = preComposite.normalizedDifference(['Green', 'NIR']).rename('NDWI');
var postNDWI = postComposite.normalizedDifference(['Green', 'NIR']).rename('NDWI');

// Compute MNDWI
var preMNDWI = preComposite.normalizedDifference(['Green', 'SWIR1']).rename('MNDWI');
var postMNDWI = postComposite.normalizedDifference(['Green', 'SWIR1']).rename('MNDWI');

// Visualization parameters for Water Indicies
var waterIndiciesVis = { min:-1, max: 1, palette: ['brown', 'beige', 'blue']};

// Add Water Indicies to the map
Map.addLayer(preNDWI.clip(SC_Coastline), waterIndiciesVis, 'Pre NDWI', false);
Map.addLayer(postNDWI.clip(SC_Coastline), waterIndiciesVis, 'Post NDWI', false);

Map.addLayer(preMNDWI.clip(SC_Coastline), waterIndiciesVis, 'Pre MNDWI', true);
Map.addLayer(postMNDWI.clip(SC_Coastline), waterIndiciesVis, 'Post MNDWI', true);

// Add study area water indicies sections for beach to beach comparisons
Map.addLayer(preMNDWI.clip(SC_Beach), waterIndiciesVis, 'SC Beach Pre MNDWI', false);
Map.addLayer(postMNDWI.clip(SC_Beach), waterIndiciesVis, 'SC Beach Post MNDWI', false);

Map.addLayer(preMNDWI.clip(Pleasure_Point), waterIndiciesVis, 'Pleasure Point Pre MNDWI', false);
Map.addLayer(postMNDWI.clip(Pleasure_Point), waterIndiciesVis, 'Pleasure Point Post MNDWI', false);

Map.addLayer(preMNDWI.clip(SeaCliffBeach), waterIndiciesVis, 'Sea Cliff Beach Pre MNDWI', false);
Map.addLayer(postMNDWI.clip(SeaCliffBeach), waterIndiciesVis, 'Sea Cliff Beach Post MNDWI', false);

// Thresholds for MNDWI Water Masks

var mndwiThreshold = 0.02;

// Create Water Masks
var preWater = preMNDWI.gt(mndwiThreshold).rename('Water');
var postWater = postMNDWI.gt(mndwiThreshold).rename('Water');

// Import palette for Water Masks
var preWaterVis = {palette: ['0000FF']};
var postWaterVis = {palette: ['00FFFF']};

// Add Water Masks to the Map
Map.addLayer(preWater.selfMask().clip(BeachOnly), preWaterVis, 'Pre Water', true);
Map.addLayer(postWater.selfMask().clip(BeachOnly), postWaterVis, 'Post Water', true);

Map.addLayer(preWater.selfMask().clip(SC_Beach), preWaterVis, 'SC Beach Pre Water', false);
Map.addLayer(postWater.selfMask().clip(SC_Beach), postWaterVis, 'SC Beach Post Water', false);

Map.addLayer(preWater.selfMask().clip(Pleasure_Point), preWaterVis, 'Pleasure Point Pre Water', false);
Map.addLayer(postWater.selfMask().clip(Pleasure_Point), postWaterVis, 'Pleasure Point Post Water', false);

Map.addLayer(preWater.selfMask().clip(SeaCliffBeach), preWaterVis, 'Sea Cliff Beach Pre Water', false);
Map.addLayer(postWater.selfMask().clip(SeaCliffBeach), postWaterVis, 'Sea Cliff Beach Post Water', false);

// Calculate change in MNDWI
var diffMNDWI = postMNDWI.subtract(preMNDWI).clip(BeachOnly).rename('dMNDWI');

// Visualize change in MNDWI
var diffMNDWIvis = { min: -0.4, max: 0.4, palette: palettes.colorbrewer.RdBu[11]};

// Add MNDWI difference to map
Map.addLayer(diffMNDWI, diffMNDWIvis, 'MNDWI Difference');

// Create Thematic Change Map using the Water Masks
var preWaterClass = preWater.unmask(0);
var postWaterClass = postWater.unmask(0);

// Create change classes: Class IDs - Stable Land = 1, Stable Water = 2, Land to Water = 3
var stableLand = preWaterClass.eq(0).and(postWaterClass.eq(0)).multiply(1);
var stableWater = preWaterClass.eq(1).and(postWaterClass.eq(1)).multiply(2);
var landToWater = preWaterClass.eq(0).and(postWaterClass.eq(1)).multiply(3);

// Create Change Map
var changeMap = stableLand.add(stableWater).add(landToWater).clip(BeachOnly).updateMask(stableLand.add(stableWater).add(landToWater).neq(0)
);

// Visualization parameters for the Change Map
var changeVis = { min: 1, max: 3, palette: ['d9d9d9', '2b83ba', '1a9641']};

// Add the Change Map to the Map
Map.addLayer(changeMap, changeVis, 'Change Map');

// Add the MNDWI Difference and Change Maps to the Study Areas
Map.addLayer(diffMNDWI.clip(SC_Beach), diffMNDWIvis, 'SC Beach MNDWI Difference', false);
Map.addLayer(diffMNDWI.clip(Pleasure_Point), diffMNDWIvis, 'Pleasure Point MNDWI Difference', false);
Map.addLayer(diffMNDWI.clip(SeaCliffBeach), diffMNDWIvis, 'SeaCliffBeach MNDWI Difference', false);

Map.addLayer(changeMap.clip(SC_Beach), changeVis, 'SC Beach Change Map', false);
Map.addLayer(changeMap.clip(Pleasure_Point), changeVis, 'Pleasure Point Change Map', false);
Map.addLayer(changeMap.clip(SeaCliffBeach), changeVis, 'SeaCliffBeach Change Map', false);

// Calculate mapped area for each Class over the collective study area
var area_image = ee.Image.pixelArea().addBands(changeMap);

var area_stats = area_image.reduceRegion({ 
  reducer: ee.Reducer.sum().group({
    groupField: 1,
    groupName: 'class'
  }),
  geometry: BeachOnly,
  scale: 10,
  maxPixels: 1e13
});

// Print area change results
print('Mapped area by class (sq m)', area_stats);

// Calculate mapped area for each class in each study area
var area_by_region = function(region, name) {
  var stats = area_image.reduceRegion({
    reducer: ee.Reducer.sum().group({
      groupField: 1,
      groupName: 'class'
    }),
    geometry: region,
    scale: 10,
    maxPixels: 1e13
  });
  print(name, stats);
};

// Run stats for each Study Area
area_by_region(SC_Beach, 'SC Beach area by Class');
area_by_region(Pleasure_Point, 'Pleasure Point area by Class');
area_by_region(SeaCliffBeach, 'Sea Cliff Beach area by Class');

// Create Sample Points for Accuracy Assessment
var CMsamplePoints = changeMap.rename('ChangeClass');

var sample_points = CMsamplePoints.stratifiedSample({
  numPoints: 0,
  classBand: 'ChangeClass',
  region: BeachOnly,
  scale: 10,
  classValues: [1, 2, 3],
  classPoints: [35,35,50],
  geometries: true
});

print(sample_points);
Map.addLayer(sample_points, {color: 'yellow'}, 'Sample Points', false);

// Export Sample Points
var sample_points_id = sample_points.map(function(f) {
  var coords = f.geometry().coordinates();
  return f.set({
    'point_id': f.get('system:index'),
    'lon': coords.get(0),
    'lat': coords.get(1)
  });
});

Export.table.toDrive({
  collection: sample_points_id,
  description: 'SC_ChangeMap_SamplePoints',
  fileNamePrefix: 'SC_ChangeMap_SamplePoints',
  fileFormat: 'CSV'
});

// Import reference table
var reference = ee.FeatureCollection('projects/united-skyline-485116-q9/assets/SC_ChangeMap_SamplePoints');

print(reference);

// Create Confusion Matrix
var conf_matrix = reference.errorMatrix('reference', 'ChangeClass');

print(conf_matrix);

// Export All Maps as .tif files
Export.image.toDrive({
  image: changeMap,
  description: 'SC_ChangeMap_3Class',
  fileNamePrefix: 'SC_ChangeMap_3Class',
  folder: 'GEE_Exports',
  region: BeachOnly,
  scale: 10,
  crs: 'EPSG:32610',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: preComposite,
  description: 'SC_PreStorm_Composite',
  fileNamePrefix: 'SC_PreStorm_Composite',
  folder: 'GEE_Exports',
  region: BeachOnly,
  scale: 10,
  crs: 'EPSG:32610',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: postComposite,
  description: 'SC_PostStorm_Composite',
  fileNamePrefix: 'SC_PostStorm_Composite',
  folder: 'GEE_Exports',
  region: BeachOnly,
  scale: 10,
  crs: 'EPSG:32610',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: diffMNDWI,
  description: 'SC_dMNDWI',
  fileNamePrefix: 'SC_dMNDWI',
  folder: 'GEE_Exports',
  region: BeachOnly,
  scale: 10,
  crs: 'EPSG:32610',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: changeMap.clip(SC_Beach),
  description: 'SC_Beach_ChangeMap',
  fileNamePrefix: 'SC_Beach_ChangeMap',
  folder: 'GEE_Exports',
  region: SC_Beach,
  scale: 10,
  crs: 'EPSG:32610',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: changeMap.clip(Pleasure_Point),
  description: 'Pleasure_Point_ChangeMap',
  fileNamePrefix: 'Pleasure_Point_ChangeMap',
  folder: 'GEE_Exports',
  region: Pleasure_Point,
  scale: 10,
  crs: 'EPSG:32610',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: changeMap.clip(SeaCliffBeach),
  description: 'SeaCliffBeach_ChangeMap',
  fileNamePrefix: 'SeaCliffBeach_ChangeMap',
  folder: 'GEE_Exports',
  region: SeaCliffBeach,
  scale: 10,
  crs: 'EPSG:32610',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: preComposite.clip(SC_Beach),
  description: 'SC_Beach_PreComposite',
  fileNamePrefix: 'SC_Beach_PreComposite',
  folder: 'GEE_Exports',
  region: SC_Beach,
  scale: 10,
  crs: 'EPSG:32610',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: preComposite.clip(Pleasure_Point),
  description: 'Pleasure_Point_PreComposite',
  fileNamePrefix: 'Pleasure_Point_PreComposite',
  folder: 'GEE_Exports',
  region: Pleasure_Point,
  scale: 10,
  crs: 'EPSG:32610',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: preComposite.clip(SeaCliffBeach),
  description: 'SeaCliffBeach_PreComposite',
  fileNamePrefix: 'SeaCliffBeach_PreComposite',
  folder: 'GEE_Exports',
  region: SeaCliffBeach,
  scale: 10,
  crs: 'EPSG:32610',
  maxPixels: 1e13
});
Export.image.toDrive({
  image: postComposite.clip(SC_Beach),
  description: 'SC_Beach_PostComposite',
  fileNamePrefix: 'SC_Beach_PostComposite',
  folder: 'GEE_Exports',
  region: SC_Beach,
  scale: 10,
  crs: 'EPSG:32610',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: postComposite.clip(Pleasure_Point),
  description: 'Pleasure_Point_PostComposite',
  fileNamePrefix: 'Pleasure_Point_PostComposite',
  folder: 'GEE_Exports',
  region: Pleasure_Point,
  scale: 10,
  crs: 'EPSG:32610',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: postComposite.clip(SeaCliffBeach),
  description: 'SeaCliffBeach_PostComposite',
  fileNamePrefix: 'SeaCliffBeach_PostComposite',
  folder: 'GEE_Exports',
  region: SeaCliffBeach,
  scale: 10,
  crs: 'EPSG:32610',
  maxPixels: 1e13
});
