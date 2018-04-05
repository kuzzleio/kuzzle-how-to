CREATE KEYSPACE IF NOT EXISTS nyc_open_data WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1' };
CREATE TYPE IF NOT EXISTS nyc_open_data.geopoint ( lat double, lon double );
CREATE TABLE IF NOT EXISTS nyc_open_data.yellow_taxi (kuzzle_id text, pickup_datetime timestamp, dropoff_datetime timestamp, passenger_count int, trip_distance double, fare_amount double, pickup_position frozen<geopoint>, dropoff_position frozen<geopoint>, PRIMARY KEY (kuzzle_id));
