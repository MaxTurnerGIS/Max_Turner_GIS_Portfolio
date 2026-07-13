# Storm-Driven Coastline Change Analysis of Santa Cruz, California

## Overview

This project used Google Earth Engine and Sentinel-2 satellite imagery to analyze coastal changes associated with the severe winter storms that impacted California during early 2023.

The objective was to identify areas where storm activity altered the shoreline and beach environments along the Santa Cruz coast by comparing pre-storm and post-storm imagery.

### Study Areas

- Santa Cruz Main Beach
- Pleasure Point
- Seacliff Beach

## Research Question

How did the January 2023 winter storm events affect shoreline conditions and coastal water extent along the Santa Cruz coastline?

## Data Sources

### Satellite Imagery

- Sentinel-2 Surface Reflectance Harmonized
- Sentinel-2 Cloud Probability

### Spatial Data

- Santa Cruz coastline boundary
- Beach study areas
- Pleasure Point
- Seacliff Beach

## Methods

### Image Preprocessing

- Applied cloud and cirrus masking
- Generated median composites for pre-storm and post-storm periods

#### Pre-Storm

- November 1, 2022
- December 31, 2022

#### Post-Storm

- January 5, 2023
- February 28, 2023

### Water Detection

The Modified Normalized Difference Water Index (MNDWI) was used to detect water extent changes.

### Change Detection

Three change classes were produced:

- Stable Land
- Stable Water
- Land to Water

### Accuracy Assessment

A stratified sample of validation points was generated and used to create a confusion matrix.

## Results

The analysis detected shoreline changes and increases in water extent following the Winter 2023 storm events.

Areas of interest included:

- Santa Cruz Beach
- Pleasure Point
- Seacliff Beach

The MNDWI difference map and thematic change map highlighted locations where coastal inundation and erosion likely occurred.

## Technologies Used

- Google Earth Engine
- JavaScript
- Sentinel-2
- Remote Sensing
- Change Detection
- Spatial Analysis
