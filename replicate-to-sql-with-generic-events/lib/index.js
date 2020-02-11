const { PostgresWrapper, pgConfigDocker } = require('./postgres');

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
    this.pg = this.initConnection();
  }

  initConnection() {
    return new PostgresWrapper(pgConfigDocker);
  }

  getProperties(doc) {
    const properties = Object.keys(doc._source).reduce((object, key) => {
      if (key !== '_kuzzle_info') {
        object[key] = doc[key];
      }
      return object;
    }, {});

    properties._id = doc._id;

    return properties;
  }

  async afterWrite(documents = []) {
    try {
      await this.pg.connect();
      const docs = documents.map(doc => this.pg.insert(this.getProperties(doc)));
      await Promise.all(docs);
      await this.pg.end();
      return documents;
    } catch (error) {
      throw error;
    }
  }
  async afterDelete(documents = []) {
    try {
      await this.pg.connect();
      const docs = documents.map(doc => this.pg.delete(doc._id));
      await Promise.all(docs);
      await this.pg.end();
      return documents;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CorePlugin;
