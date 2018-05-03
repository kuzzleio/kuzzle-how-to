[![Build Status](https://travis-ci.org/kuzzleio/kuzzle-how-to.svg?branch=master)](https://travis-ci.org/kuzzleio/kuzzle-how-to)

# Kuzzle How-To

In this repository we are going to explore different features of Kuzzle.  
These How-To guides include sample data and scripts.  

## Getting started

The How-To requires Docker, ensure that your system meets the following requirements:

- **64-bit environment**
- **Docker v1.10+**, see [instructions here](https://docs.docker.com/engine/installation/)
- **Docker Compose v1.8+**, see [instructions here](https://docs.docker.com/compose/install/)

## Sample data

In order to provide a meaningful How-To guide we use data from various Open Data sources.  
This data lets you test out Kuzzle functionalities using real world datasets.

#### NYC Open Data (Yellow Taxi)

This sample came from the [NYC OpenData](https://opendata.cityofnewyork.us/) initiative which provides datasets specific to New York city.  
We use a small subset of the [Yellow Taxi Trip Data](https://data.cityofnewyork.us/Transportation/2016-Yellow-Taxi-Trip-Data/k67s-dv2t) which consists of 1 million Taxi entries and includes dates and geolocation information.  

With this sample you will be able to perform a massive data import with live geofencing subscription ([here](massive-data-import/)) or synchronize the data with another database in real-time ([here](sync-data-to-another-database/)).  

## Learn something cool

 - [Massive data import](massive-data-import/)
 - [Synchronize Kuzzle with another database](sync-data-to-another-database/)
 - [Keep only warm data in Kuzzle](keep-only-warm-data/)
 - [Monitor IoT data with Freeboard](monitor-iot-data-with-freeboard/)

## Distribution process

All Scenarios are tested and built with Travis CI. They're available [here](https://dl.kuzzle.io)

## Run tests

Each How-To come with End2End tests against the latest version of Kuzzle.  
You can run them by executing the `run_tests.sh` script present in each How-To folder.
