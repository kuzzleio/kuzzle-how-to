const { v4: uuidv4 } = require('uuid');
const { PostgresWrapper, pgConfigDocker } = require('./postgres');

class CorePlugin {
  constructor() {
    this.context = null;
    this.config = {};
    this.pipes = {
      'generic:document:beforeWrite': 'beforeWrite',
      'generic:document:beforeDelete': 'beforeDelete'
    };
  }

  async init(customConfig, context) {
    this.config = Object.assign(this.config, customConfig);
    this.context = context;
    this.pg = new PostgresWrapper(pgConfigDocker);
    await this.pg.connect();
    context.log.info('database connected');
  }

  async beforeWrite(documents = []) {
    const withIds = documents.map(doc => Object.assign(doc, { _id: uuidv4() }));

    if (withIds.length) {
      const docs = withIds.map(doc => Object.assign({ _id: doc._id }, doc._source));
      await this.pg.multiLineInsert(docs);
    }

    return withIds;
  }

  async beforeDelete(documents = []) {
    if (documents.length) {
      const docIds = documents.map(docs => docs._id);
      await this.pg.mDelete(docIds);
    }

    return documents;
  }
}

module.exports = CorePlugin;
