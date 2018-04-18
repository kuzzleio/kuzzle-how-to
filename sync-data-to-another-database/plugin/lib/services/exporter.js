'use strict';

const cassandra = require('cassandra-driver');

const chunkArray = (array, chunkSize) => {
  let results = [];

  while (array.length) {
    results.push(array.splice(0, chunkSize));
  }

  return results;
};

class Exporter {
  constructor (config, context) {

    this.config = config;
    this.context = context;

    this.client = new cassandra.Client({ contactPoints: this.config.contactPoints });
  }

  connectWithRetry() {
    return this.client
      .connect()
      .then(() => {
        this.context.log.info('[kuzzle-plugin-sync-cassandra] Cassandra client connected');
        return true;
      })
      .catch(error => {
        if (this.config.retryCount <= 0) {
          throw new this.context.errors.ExternalServiceError(`[kuzzle-plugin-sync-cassandra] Unable to connect the client : ${error.message}`);
        } else {
          this.context.log.info(`[kuzzle-plugin-sync-cassandra] Failed to connect to Cassandra on startup - ${error.message} - retrying in 2 sec`);
          this.config.retryCount -= 1;
          setTimeout(() => {
            this.connectWithRetry();
          }, 5000);
        }
      });
  }

  createOrUpdateDocuments (documents) {
    // Split documents array in chunk to avoid the batch size limit
    const chunkedDocuments = chunkArray(documents, this.config.maximumBatchSize);

    const requestPromises =
      chunkedDocuments.map(documentsBatch => {

        // Create an array of update queries and an array of matching values
        const { query, values } = documentsBatch.reduce((memo, document) => {

          // Create the column list with the placeholder
          const columnsList = Object.keys(document._source).filter(key => key !== '_id').map(column => `${column} = ?`).join(', ');

          // Create an array of values to allow the driver to map javascript types to cassandra types
          const valuesList = Object.keys(document._source).filter(key => key !== '_id').map(key => {
            switch (key) {
              case 'trip_distance':
              case 'fare_amount':
                return parseFloat(document._source[key]);
              default:
                return document._source[key];
            }
          }).concat([document._id]);

          // Create the query and replace Cassandra forbidden characters
          const updateQuery = this.normalize(`UPDATE ${document._index}.${document._type} SET ${columnsList} WHERE kuzzle_id = ?`);

          return { query: memo.query.concat([updateQuery]), values: memo.values.concat(valuesList) };
        }, { query: [], values: []});

        const batchQuery = `BEGIN BATCH ${query.join(';')} APPLY BATCH`;

        // Create a promise to execute the query
        return this.client.execute(batchQuery, values, { prepare: true });
      });

    return Promise.all(requestPromises);
  }

  deleteDocuments({ keyspace, table, kuzzleIds }) {
    const query = this.normalize(`DELETE FROM ${keyspace}.${table} WHERE kuzzle_id IN (?)`);

    return this.client.execute(query, kuzzleIds, { prepare: true });
  }

  normalize(entityName) {
    return entityName.replace(new RegExp('-', 'g'), '_');
  }
}

module.exports = Exporter;
