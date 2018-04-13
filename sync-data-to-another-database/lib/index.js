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

    this.hooks = {
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
      return Promise.reject(new this.context.errors.InternalError('[kuzzle-plugin-export-cassandra] You must provide at least one contactPoints'));
    }

    this.exporter = new Exporter(this.config.cassandra, context);

    return this.exporter.connectWithRetry()
      .then(() => this)
      .catch(error => Promise.reject(error))
  }

  hookPutDocument (request) {
    const document = request.response.result;

    this.exporter.createOrUpdateDocuments([document])
      .then(() => this.context.log.debug('[kuzzle-plugin-export-cassandra] Document inserted'))
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-export-cassandra] Error inserting document');
        this.context.log.error(error);
      });
  }

  hookPutDocuments (request) {
    const response = request.response;

    this.exporter.createOrUpdateDocuments(response.result.hits)
      .then(() => this.context.log.debug(`[kuzzle-plugin-export-cassandra] ${response.result.hits.length} Document inserted`))
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-export-cassandra] Error inserting document');
        this.context.log.error(error);
      });
  }

  hookUpdateDocument (request) {
    const response = request.response;
    const document = {
      _id: response.result._id,
      _index: response.index,
      _type: response.collection,
      _source: Object.assign({}, response.body)
    };

    this.exporter.createOrUpdateDocuments([document])
      .then(() => this.context.log.debug('[kuzzle-plugin-export-cassandra] Document updated'))
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-export-cassandra] Error inserting document');
        this.context.log.error(error);
      });
  }

  hookUpdateDocuments (request) {
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
      .then(() => this.context.log.debug(`[kuzzle-plugin-export-cassandra] ${documents.length} document updated`))
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-export-cassandra] Error updating documents');
        this.context.log.error(error);
      });
  }

  hookDeleteDocument (request) {
    const response = request.response;

    this.exporter.deleteDocuments({ keyspace: response.index, table: response.collection, kuzzleIds: [response.result._id] })
      .then(() => this.context.log.debug('[kuzzle-plugin-export-cassandra] Document deleted'))
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-export-cassandra] Error deleting document');
        this.context.log.error(error);
      });
  }

  hookDeleteDocuments (request) {
    const response = request.response;

    this.exporter.deleteDocuments({ keyspace: response.index, table: response.collection, kuzzleIds: response.result.hits })
      .then(() => this.context.log.debug(`[kuzzle-plugin-export-cassandra] ${response.result.hits.length} documents deleted`))
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-export-cassandra] Error deleting document');
        this.context.log.error(error);
      });
  }

  hookMDeleteDocuments (request) {
    const response = request.response;

    this.exporter.deleteDocuments({ keyspace: response.index, table: response.collection, kuzzleIds: response.result })
      .then(() => this.context.log.debug(`[kuzzle-plugin-export-cassandra] ${response.result.length} documents deleted`))
      .catch(error => {
        this.context.log.error('[kuzzle-plugin-export-cassandra] Error deleting documents');
        this.context.log.error(error);
      });
  }

  hookError(request) {
    this.context.log.error(request.error);
  }
}

module.exports = ExportCassandra;
