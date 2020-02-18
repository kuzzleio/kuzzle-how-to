const { Pool } = require('pg');

const pgConfig = {
  user: 'my_user',
  database: 'nyc_open_data',
  password: 'password',
  port: 5432
};

const pgConfigLocal = Object.assign({ host: 'localhost' }, pgConfig);
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

  formatPlaceholders(values) {
    return values.map((_, i) => `$${i + 1}`).join(',');
  }

  async insert(data) {
    const params = Object.keys(data).join(',');
    const values = Object.values(data);
    const indexes = this.formatPlaceholders(values);
    const query = `INSERT INTO yellow_taxi (${params}) VALUES(${indexes})`;
    return this.pool.query(query, values);
  }

  async delete(docId) {
    const query = 'DELETE FROM yellow_taxi WHERE yellow_taxi._id=$1';
    return this.pool.query(query, [docId]);
  }

  async countData() {
    const query = 'SELECT COUNT(*) FROM yellow_taxi';
    return this.pool.query(query);
  }
}

module.exports = {
  PostgresWrapper,
  pgConfigLocal,
  pgConfigDocker
};
