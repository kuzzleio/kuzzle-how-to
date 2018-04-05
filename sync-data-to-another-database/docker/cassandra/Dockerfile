FROM cassandra:3

ADD create_keyspace.cql docker-entrypoint-initdb.d/create_keyspace.cql

COPY docker-entrypoint.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/docker-entrypoint.sh
