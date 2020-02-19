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

  async init(customConfig, context) {
    this.config = Object.assign(this.config, customConfig);
    this.context = context;
    this.pg = new PostgresWrapper(pgConfigDocker);
    await this.pg.connect();
    context.log.info('database connected');
  }

  getProperties(doc) {
    const properties = doc._source;
    delete properties._kuzzle_info;
    properties._id = doc._id;

    return properties;
  }

  async afterWrite(documents = []) {
    const promises = documents.map(doc => this.pg.insert(this.getProperties(doc)));
    await Promise.all(promises);

    return documents;
  }

  async afterDelete(documents = []) {
    const promises = documents.map(doc => this.pg.delete(doc._id));
    await Promise.all(promises);

    return documents;
  }
}

module.exports = CorePlugin;
