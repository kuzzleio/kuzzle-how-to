const { Pool } = require('pg');
const format = require('pg-format');

const pgConfig = {
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432
};

const pgConfigDocker = Object.assign({ host: 'postgresql' }, pgConfig);

class PostgresWrapper {
  constructor(config) {
    this.config = config;
    this.pool = new Pool(config);
  }

  connect() {
    return this.pool.connect();
  }

  disconnect() {
    return this.pool.end();
  }

  async multiLineInsert(docs = []) {
    const keys = docs.length > 0 ? Object.keys(docs[0]).join(',') : {};
    const result = docs.map(doc => Object.values(doc));
    const query = format(`INSERT INTO yellow_taxi (${keys}) VALUES %L`, result);
    return this.pool.query(query);
  }

  async mDelete(docIds) {
    const values = docIds.map((_, idx) => `$${idx + 1}`);
    const query = `DELETE FROM yellow_taxi WHERE yellow_taxi._id IN (${values})`;
    return this.pool.query(query, docIds);
  }

  async countData() {
    const query = 'SELECT COUNT(*) FROM yellow_taxi';
    return this.pool.query(query);
  }
}

module.exports = {
  PostgresWrapper,
  pgConfigDocker
};
