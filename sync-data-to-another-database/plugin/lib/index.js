'use strict';

const Exporter = require('./services/exporter');

class ExportCassandra {

  constructor () {
    this.context = null;

    this.config = {
      cassandra: {
        contactPoints: [ 'cassandra' ],
        retryCount: 3,
        maximumBatchSize: 26
      }
    };

    this.pipes = {
      'document:afterCreate':           'hookPutDocument',
      'document:afterCreateOrReplace':  'hookPutDocument',
      'document:afterReplace':          'hookPutDocument',
      'document:afterDelete':           'hookDeleteDocument',
      'document:afterDeleteByQuery':    'hookDeleteDocuments',
      'document:afterUpdate':           'hookUpdateDocument',

      'document:afterMCreate':          'hookPutDocuments',
      'document:afterMCreateOrReplace': 'hookPutDocuments',
      'document:afterMReplace':         'hookPutDocuments',
      'document:afterMDelete':          'hookMDeleteDocuments',
      'document:afterMUpdate':          'hookUpdateDocuments',

      'request:onError':                'hookError'
    };

  }

  init (customConfig, context) {
    this.config = Object.assign(this.config, customConfig);

    this.context = context;

    if (! this.config.cassandra.contactPoints || this.config.cassandra.contactPoints.length < 1) {
      return Promise.reject(new this.context.errors.InternalError('[kuzzle-plugin-sync-cassandra] You must provide at least one contactPoints'));
    }

    this.exporter = new Exporter(this.config.cassandra, context);

    return this.exporter.connectWithRetry()
      .then(() => this)
      .catch(error => Promise.reject(error));
  }

  hookPutDocument (request, callback) {
    const document = request.response.result;

    this.exporter.createOrUpdateDocuments([document])
      .then(() => {
        this.context.log.debug('[kuzzle-plugin-sync-cassandra] Document inserted');
        callback(null, request);
      })
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-sync-cassandra] Error inserting document');
        this.context.log.error(error);
        callback(new this.context.errors.ExternalServiceError(`Error inserting document in cassandra: ${error.message}`), request);
      });
  }

  hookPutDocuments (request, callback) {
    const response = request.response;

    this.exporter.createOrUpdateDocuments(response.result.hits)
      .then(() => {
        this.context.log.debug(`[kuzzle-plugin-sync-cassandra] ${response.result.hits.length} Document inserted`);
        callback(null, request);
      })
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-sync-cassandra] Error inserting document');
        this.context.log.error(error);
        callback(new this.context.errors.ExternalServiceError(`Error inserting document in cassandra: ${error.message}`), request);
      });
  }

  hookUpdateDocument (request, callback) {
    const response = request.response;
    const document = {
      _id: response.result._id,
      _index: response.index,
      _type: response.collection,
      _source: Object.assign({}, response.body)
    };

    this.exporter.createOrUpdateDocuments([document])
      .then(() => {
        this.context.log.debug('[kuzzle-plugin-sync-cassandra] Document updated');
        callback(null, request);
      })
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-sync-cassandra] Error inserting document');
        this.context.log.error(error);
        callback(new this.context.errors.ExternalServiceError(`Error inserting document in cassandra: ${error.message}`), request);
      });
  }

  hookUpdateDocuments (request, callback) {
    const response = request.response;
    const documents = response.body.documents.map(({ _id, body }) => {
      return {
        _id: _id,
        _index: response.index,
        _type: response.collection,
        _source: Object.assign({}, body)
      };
    });

    this.exporter.createOrUpdateDocuments(documents)
      .then(() => {
        this.context.log.debug(`[kuzzle-plugin-sync-cassandra] ${documents.length} document updated`);
        callback(null, request);
      })
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-sync-cassandra] Error updating documents');
        this.context.log.error(error);
        callback(new this.context.errors.ExternalServiceError(`Error inserting document in cassandra: ${error.message}`), request);
      });
  }

  hookDeleteDocument (request, callback) {
    const response = request.response;

    this.exporter.deleteDocuments({ keyspace: response.index, table: response.collection, kuzzleIds: [response.result._id] })
      .then(() => {
        this.context.log.debug('[kuzzle-plugin-sync-cassandra] Document deleted');
        callback(null, request);
      })
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-sync-cassandra] Error deleting document');
        this.context.log.error(error);
        callback(new this.context.errors.ExternalServiceError(`Error deleting document in cassandra: ${error.message}`), request);
      });
  }

  hookDeleteDocuments (request, callback) {
    const response = request.response;

    this.exporter.deleteDocuments({ keyspace: response.index, table: response.collection, kuzzleIds: response.result.hits })
      .then(() => {
        this.context.log.debug(`[kuzzle-plugin-sync-cassandra] ${response.result.hits.length} documents deleted`);
        callback(null, request);
      })
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-sync-cassandra] Error deleting document');
        this.context.log.error(error);
        callback(new this.context.errors.ExternalServiceError(`Error deleting documents in cassandra: ${error.message}`), request);
      });
  }

  hookMDeleteDocuments (request, callback) {
    const response = request.response;

    this.exporter.deleteDocuments({ keyspace: response.index, table: response.collection, kuzzleIds: response.result })
      .then(() => {
        this.context.log.debug(`[kuzzle-plugin-sync-cassandra] ${response.result.length} documents deleted`);
        callback(null, request);
      })
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-sync-cassandra] Error deleting documents');
        this.context.log.error(error);
        callback(new this.context.errors.ExternalServiceError(`Error deleting documents in cassandra: ${error.message}`), request);
      });
  }

  hookError(request, callback) {
    this.context.log.error(request.error);
    callback(null, request)
  }
}

module.exports = ExportCassandra;
