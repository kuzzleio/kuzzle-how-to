FROM cassandra:3

LABEL maintainer="amaret@kuzzle.io"

COPY create_keyspace.cql docker-entrypoint-initdb.d/create_keyspace.cql

COPY docker-entrypoint.sh /usr/local/bin/

CMD /usr/local/bin/docker-entrypoint.sh
