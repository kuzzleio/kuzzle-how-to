# Keep only warm data into Kuzzle

## Introduction

Kuzzle est capable de gérer un très grand nombre de documents en offrant de très bonnes performances.  
Cependant dans un contexte Big Data, il peut être intéressant de rationnaliser le coût de l'infrastructure nécessaire à Kuzzle en ne gardant sur Kuzzle que les données pertinentes.  
Couplé avec une base de données secondaire, Kuzzle peut-être utilisé dans une architecture Hot/Warm ou les données les plus récentes sont conservées sur Kuzzle et les données les plus anciennes dans un SGBD secondaire.  


## Architecture

We will be using the standard Kuzzle stack (Kuzzle, Elasticsearch and Redis). (Check [docker-compose.yml](docker-compose.yml) for more details)

On Kuzzle, the data will be stored in the `yellow-taxi` collection of the `nyc-open-data` index according to the following mapping:

```js
{
  "pickup_datetime":  { "type": "date", "format": "MM/dd/yyyy hh:mm:ss a" },
  "dropoff_datetime": { "type": "date", "format": "MM/dd/yyyy hh:mm:ss a" },
  "passenger_count":  { "type": "long" },
  "trip_distance":    { "type": "double" },
  "pickup_position":  { "type": "geo_point" },
  "dropoff_position": { "type": "geo_point" },
  "fare_amount":      { "type": "double" }
}
```

The document creat

## Clean old data

## Try it yourself
