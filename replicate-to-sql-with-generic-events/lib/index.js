const { PostgresWrapper } = require('./postgres');

class CorePlugin {
  constructor() {
    this.context = null;
    this.config = {};
    this.pipes = {
      'generic:document:afterWrite': 'afterWrite',
      'generic:document:afterDelete': 'afterDelete'
    };
  }

  init(customConfig, context) {
    this.config = Object.assign(this.config, customConfig);
    this.context = context;
    this.pg = new PostgresWrapper();
  }

  async afterWrite(documents = []) {
    try {
      const docs = documents.map(doc => {
        delete doc._source._kuzzle_info;
        doc._source._id = doc._id;
        return this.pg.insert(doc._source);
      });

      await Promise.all(docs);
    } catch (error) {
      console.error(error);
    }

    return documents;
  }
  async afterDelete(documents = []) {
    try {
      const docs = documents.map(doc => {
        return this.pg.delete(doc._id);
      });

      await Promise.all(docs);
    } catch (error) {
      console.error(error);
    }
    return documents;
  }
}

module.exports = CorePlugin;
