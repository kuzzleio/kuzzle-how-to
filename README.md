# Kuzzle How-To

In this repository we are going to explore some Kuzzle possibilities.  
These How-To come along with sample data and scripts.  

## Get started

These How-To uses Docker, ensure that your system meets the following requirements:

- **64-bit environment**
- **Docker v1.10+**, see [instructions here](https://docs.docker.com/engine/installation/)
- **Docker Compose v1.8+**, see [instructions here](https://docs.docker.com/compose/install/)

## What are the sample data

We provide to you some real data from various Open Data initiative.  
With this data you can try out Kuzzle functionalities with big real data set.

#### NYC Open Data (Yellow Taxi)

This sample came from the [NYC OpenData](https://opendata.cityofnewyork.us/) initiative which provide a lot of data about New-York city.  
We use the [Yellow Taxi Trip Data](https://data.cityofnewyork.us/Transportation/2016-Yellow-Taxi-Trip-Data/k67s-dv2t) with 1 million of taxi entries including dates and geolocation informations.  

With this sample you are going to push Kuzzle within its limits by performing massive data import with live geofencing subscription ([here](massive-data-import/)) or synchronize theses data in real-time to another database ([here](sync-data-to-another-database/)).  

## Learn something cool

  - [Massive data importation](massive-data-import/)
  - [Synchronize Kuzzle with another database](sync-data-to-another-database/)
  - [Keep only warm data into Kuzzle](keep-only-warm-data/) (wip)
