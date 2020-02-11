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
    this.createClient(this.config);
  }

  createClient(config) {
    const client = new Client(config);
    this.client = client;
  }

  async connect() {
    return this.client.connect();
  }

  async end() {
    return this.client.end();
  }

  formatIndex(values) {
    return values
      .reduce((prev, cur, index) => {
        prev.push(`$${index + 1}`);
        return prev;
      }, [])
      .join(',');
  }

  async insert(data) {
    const params = Object.keys(data).join(',');
    const values = Object.values(data);
    const indexes = this.formatIndex(values);
    const query = `INSERT INTO yellow_taxi (${params}) VALUES(${indexes})`;
    const result = await this.client.query(query, values);
    return result;
  }

  async delete(docId) {
    const query = `DELETE FROM yellow_taxi WHERE yellow_taxi._id='${docId}'`;
    const result = this.client.query(query);
    return result;
  }
  async countData() {
    const query = 'SELECT COUNT(*) FROM yellow_taxi';
    const result = await this.client.query(query);
    return result;
  }
}

module.exports = {
  PostgresWrapper,
  pgConfigLocal,
  pgConfigDocker
};
