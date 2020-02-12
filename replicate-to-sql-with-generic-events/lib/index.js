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
    this.pg = new PostgresWrapper(pgConfigDocker);
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
    await this.pg.connect();
    const promises = documents.map(doc => this.pg.insert(this.getProperties(doc)));
    await Promise.all(promises);
    await this.pg.end();
    return documents;
  }
  async afterDelete(documents = []) {
    await this.pg.connect();
    const promises = documents.map(doc => this.pg.delete(doc._id));
    await Promise.all(promises);
    await this.pg.end();
    return documents;
  }
}

module.exports = CorePlugin;
