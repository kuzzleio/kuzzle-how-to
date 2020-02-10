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
  }

  initConnection() {
    return new PostgresWrapper({
      user: 'my_user',
      host: 'postgresql',
      database: 'postgres',
      password: 'password',
      port: 5432
    });
  }

  async afterWrite(documents = []) {
    try {
      const pg = this.initConnection();
      pg.connect();
      const docs = documents.map(doc => {
        delete doc._source._kuzzle_info;
        doc._source._id = doc._id;
        return pg.insert(doc._source);
      });

      await Promise.all(docs);
      pg.end();
    } catch (error) {
      console.error(error);
    }

    return documents;
  }
  async afterDelete(documents = []) {
    try {
      const pg = this.initConnection();
      pg.connect();
      const docs = documents.map(doc => {
        return pg.delete(doc._id);
      });

      await Promise.all(docs);
      pg.end();
    } catch (error) {
      console.error(error);
    }

    return documents;
  }
}

module.exports = CorePlugin;
