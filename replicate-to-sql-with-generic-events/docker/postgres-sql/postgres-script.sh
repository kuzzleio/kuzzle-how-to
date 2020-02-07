psql --command "CREATE ROLE my_user WITH SUPERUSER CREATEDB CREATEROLE LOGIN ENCRYPTED PASSWORD 'password';"
psql --command "
    CREATE TABLE yellow_taxi(
        _id VARCHAR (50) PRIMARY KEY,
        VendorID VARCHAR (50),
        tpep_pickup_datetime VARCHAR (50),
        tpep_dropoff_datetime VARCHAR (50),
        passenger_count VARCHAR (50),
        trip_distance VARCHAR (50),
        RatecodeID VARCHAR (50),
        store_and_fwd_flag VARCHAR (50),
        PULocationID VARCHAR (50),
        DOLocationID VARCHAR (50),
        payment_type VARCHAR (50),
        fare_amount VARCHAR (50),
        extra VARCHAR (50),
        mta_tax VARCHAR (50),
        tip_amount VARCHAR (50),
        tolls_amount VARCHAR (50), improvement_surcharge VARCHAR (50), total_amount VARCHAR (50));
    "