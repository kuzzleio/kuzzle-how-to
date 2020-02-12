const { Client } = require('pg');

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
    this.client = new Client(config);
  }

  connect() {
    return this.client.connect();
  }

  end() {
    return this.client.end();
  }

  formatPlaceholders(values) {
    return values.map((_, i) => `$${i + 1}`).join(',');
  }

  async insert(data) {
    const [params, values] = Object.entries(data);
    const indexes = this.formatPlaceholders(values);
    const query = `INSERT INTO yellow_taxi (${params.join(',')}) VALUES(${indexes})`;
    return this.client.query(query, values);
  }

  async delete(docId) {
    const query = `DELETE FROM yellow_taxi WHERE yellow_taxi._id='${docId}'`;
    return this.client.query(query);
  }
  async countData() {
    const query = 'SELECT COUNT(*) FROM yellow_taxi';
    return this.client.query(query);
  }
}

module.exports = {
  PostgresWrapper,
  pgConfigLocal,
  pgConfigDocker
};
